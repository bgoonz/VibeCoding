import os
import secrets
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

import ai
from board import Board, Model, Snapshot, initialize, load_board, save_board, user_id

ROOT = Path(__file__).resolve().parent


class Credentials(Model):
    username: str
    password: str


def create_app(db_path=None, static_dir=None):
    path = Path(db_path or os.getenv("KANBAN_DB", ROOT / "db.sqlite3"))
    assets = Path(static_dir or os.getenv("KANBAN_STATIC", ROOT / "static"))

    @asynccontextmanager
    async def lifespan(app):
        path.parent.mkdir(parents=True, exist_ok=True)
        initialize(path, Board.model_validate_json((ROOT / "seed.json").read_text(encoding="utf-8")))
        yield

    app = FastAPI(lifespan=lifespan)
    app.add_middleware(
        SessionMiddleware,
        secret_key=os.getenv("SESSION_SECRET") or secrets.token_urlsafe(32),
        same_site="strict",
    )

    def owner(request: Request):
        if "user_id" not in request.session:
            raise HTTPException(401, "Sign in to continue.")
        return request.session["user_id"]

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    @app.get("/api/session")
    def session(request: Request):
        return {"signedIn": "user_id" in request.session}

    @app.post("/api/login")
    def login(credentials: Credentials, request: Request):
        if credentials.username != "user" or credentials.password != "password":
            raise HTTPException(401, "Incorrect username or password.")
        request.session["user_id"] = user_id(path, credentials.username)
        return {"signedIn": True}

    @app.post("/api/logout")
    def logout(request: Request):
        request.session.clear()
        return {"signedIn": False}

    @app.get("/api/board")
    def get_board(user: int = Depends(owner)):
        return load_board(path, user)

    def persist(user, snapshot):
        saved = save_board(path, user, snapshot)
        if saved is None:
            raise HTTPException(409, "The board changed. Your update was not saved.")
        return saved

    @app.put("/api/board")
    def put_board(snapshot: Snapshot, user: int = Depends(owner)):
        return persist(user, snapshot)

    @app.post("/api/chat")
    def post_chat(request: ai.ChatRequest, user: int = Depends(owner)):
        snapshot = load_board(path, user)
        reply, board = ai.chat(snapshot.board, request)
        updated = persist(user, Snapshot(board=board, revision=snapshot.revision)) if board else None
        return {"reply": reply, "snapshot": updated}

    if assets.is_dir():
        app.mount("/", StaticFiles(directory=assets, html=True), name="frontend")
    return app


app = create_app()
