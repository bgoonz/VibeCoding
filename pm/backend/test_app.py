import json

import httpx
import pytest
from fastapi.testclient import TestClient

import ai
from board import connect
from main import create_app


@pytest.fixture
def database(tmp_path):
    return tmp_path / "kanban.sqlite3"


@pytest.fixture
def client(database):
    with TestClient(create_app(database)) as client:
        yield client


def sign_in(client):
    response = client.post("/api/login", json={"username": "user", "password": "password"})
    assert response.status_code == 200
    assert "httponly" in response.headers["set-cookie"].lower()


def test_static_and_health(database, tmp_path):
    site = tmp_path / "site"
    site.mkdir()
    (site / "index.html").write_text("<h1>Hello world</h1>")
    with TestClient(create_app(database, site)) as client:
        assert client.get("/").text == "<h1>Hello world</h1>"
        assert client.get("/api/health").json() == {"status": "ok"}


def test_authentication(client):
    assert client.get("/api/session").json() == {"signedIn": False}
    assert client.get("/api/board").status_code == 401
    assert client.put("/api/board", json={}).status_code == 401
    assert client.post("/api/chat", json={}).status_code == 401
    assert client.post("/api/login", json={"username": "user", "password": "wrong"}).status_code == 401
    assert client.get("/api/session", headers={"Cookie": "session=invalid"}).json() == {"signedIn": False}
    sign_in(client)
    assert client.get("/api/session").json() == {"signedIn": True}
    assert client.post("/api/logout").json() == {"signedIn": False}
    assert client.get("/api/board").status_code == 401


def test_persistence_and_conflict(client, database):
    sign_in(client)
    original = client.get("/api/board").json()
    original["board"]["columns"][0]["title"] = "Planning"
    saved = client.put("/api/board", json=original).json()
    assert saved["revision"] == 1
    assert client.put("/api/board", json=original).status_code == 409
    with TestClient(create_app(database)) as restarted:
        sign_in(restarted)
        assert restarted.get("/api/board").json() == saved


@pytest.mark.parametrize("invalid", ["duplicate", "missing", "wrong_key", "columns"])
def test_rejects_invalid_board(client, invalid):
    sign_in(client)
    original = client.get("/api/board").json()
    update = client.get("/api/board").json()
    board = update["board"]
    if invalid == "duplicate":
        board["columns"][1]["cardIds"].append("card-1")
    elif invalid == "missing":
        del board["cards"]["card-1"]
    elif invalid == "wrong_key":
        board["cards"]["card-1"]["id"] = "other"
    else:
        board["columns"].reverse()
    assert client.put("/api/board", json=update).status_code == 422
    assert client.get("/api/board").json() == original


def test_user_isolation(client, database):
    sign_in(client)
    first = client.get("/api/board").json()
    with connect(database) as db, db:
        db.execute("INSERT INTO users VALUES (2, 'other')")
        db.execute("INSERT INTO boards VALUES (2, ?, 0)", (json.dumps(first["board"]),))
    first["board"]["columns"][0]["title"] = "My planning"
    assert client.put("/api/board", json={**first, "user_id": 2}).status_code == 422
    assert client.put("/api/board", json=first).status_code == 200
    with connect(database) as db:
        raw, revision = db.execute("SELECT board_json, revision FROM boards WHERE user_id = 2").fetchone()
    assert json.loads(raw)["columns"][0]["title"] == "Backlog"
    assert revision == 0


def test_chat_history_and_multi_card_update(client, monkeypatch):
    sign_in(client)

    def complete(messages, **options):
        assert messages[1]["content"] == "Earlier question"
        assert messages[2]["role"] == "assistant"
        payload = json.loads(messages[-1]["content"])
        assert payload["request"] == "Update the board"
        assert payload["board"]["columns"][0]["title"] == "Backlog"
        assert options["response_format"]["json_schema"]["strict"]
        return json.dumps({
            "reply": "Updated.",
            "create": [{"column_id": "col-backlog", "title": "New", "details": ""}],
            "edit": [{"card_id": "card-1", "title": "Edited", "details": "Changed"}],
            "move": [
                {"card_id": "card-1", "column_id": "col-done"},
                {"card_id": "card-2", "column_id": "col-done"},
            ],
        })

    monkeypatch.setattr(ai, "completion", complete)
    response = client.post("/api/chat", json={
        "message": "Update the board",
        "history": [
            {"role": "user", "content": "Earlier question"},
            {"role": "assistant", "content": "Earlier answer"},
        ],
    })
    assert response.status_code == 200
    result = response.json()
    assert result["reply"] == "Updated."
    board = result["snapshot"]["board"]
    assert board["cards"]["card-1"]["title"] == "Edited"
    assert board["columns"][-1]["cardIds"][-2:] == ["card-1", "card-2"]
    assert board["cards"][board["columns"][0]["cardIds"][0]]["title"] == "New"
    assert client.get("/api/board").json() == result["snapshot"]


@pytest.mark.parametrize("reply,status", [
    ({"reply": "Answer", "create": [], "edit": [], "move": []}, 200),
    ("malformed", 502),
    ({"reply": "Deleted", "delete": ["card-1"], "create": [], "edit": [], "move": []}, 502),
    ({"reply": "Moved", "create": [], "edit": [], "move": [{"card_id": "missing", "column_id": "col-done"}]}, 502),
])
def test_chat_without_valid_update(client, monkeypatch, reply, status):
    sign_in(client)
    original = client.get("/api/board").json()
    monkeypatch.setattr(ai, "completion", lambda *args, **kwargs: json.dumps(reply))
    response = client.post("/api/chat", json={"message": "Hello", "history": []})
    assert response.status_code == status
    if status == 200:
        assert response.json() == {"reply": "Answer", "snapshot": None}
    assert client.get("/api/board").json() == original


def test_chat_conflict(client, database, monkeypatch):
    sign_in(client)

    def complete(*args, **kwargs):
        with connect(database) as db, db:
            db.execute("UPDATE boards SET revision = revision + 1")
        return json.dumps({
            "reply": "Moved", "create": [], "edit": [],
            "move": [{"card_id": "card-1", "column_id": "col-done"}],
        })

    monkeypatch.setattr(ai, "completion", complete)
    assert client.post("/api/chat", json={"message": "Move it", "history": []}).status_code == 409
    assert "card-1" in client.get("/api/board").json()["board"]["columns"][0]["cardIds"]


@pytest.mark.parametrize("failure,status", [("missing key", 503), ("timeout", 502), ("provider error", 502)])
def test_provider_failure(client, monkeypatch, failure, status):
    sign_in(client)
    original = client.get("/api/board").json()
    if failure == "missing key":
        monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    else:
        monkeypatch.setenv("OPENROUTER_API_KEY", "test")
        def post(*args, **kwargs):
            if failure == "timeout":
                raise httpx.ReadTimeout("Timed out")
            return httpx.Response(429, request=httpx.Request("POST", args[0]))
        monkeypatch.setattr(ai.httpx, "post", post)
    assert client.post("/api/chat", json={"message": "Hello", "history": []}).status_code == status
    assert client.get("/api/board").json() == original
