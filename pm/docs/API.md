# API reference

The Docker app serves JSON endpoints under `http://127.0.0.1:8000/api` by default. Requests with a JSON body use `Content-Type: application/json`. The browser sends the session cookie on same-origin requests.

| Method and path | Request | Success response |
| --- | --- | --- |
| `GET /api/health` | None | `{"status":"ok"}` |
| `GET /api/session` | None | `{"signedIn":true}` or `{"signedIn":false}` |
| `POST /api/login` | `{"username":"user","password":"password"}` | `{"signedIn":true}` and a session cookie |
| `POST /api/logout` | None | `{"signedIn":false}` and a cleared cookie |
| `GET /api/board` | Session cookie | Current board snapshot |
| `PUT /api/board` | Session cookie and complete board snapshot | Saved snapshot with an incremented revision |
| `POST /api/chat` | Session cookie and a message with history | Reply and a snapshot when the board changed |

## Board snapshots

A snapshot contains `board` and `revision`. The board contains `columns` and `cards`. Each column has `id`, `title`, and an ordered `cardIds` array. Each card has `id`, `title`, and `details`. The `cards` object uses each card's ID as its key.

To update a board, fetch it, modify the desired fields, and send the full snapshot with its original revision. Include all five columns in their current order. See [SQLite schema and validation](DATABASE.md) for the board invariants.

## Chat

Send the new message separately from previous turns. History entries use the roles `user` and `assistant`.

```json
{
  "message": "What is in the backlog?",
  "history": []
}
```

A reply without a board change has a null snapshot.

```json
{
  "reply": "There are two cards in the backlog.",
  "snapshot": null
}
```

When the assistant saves a change, `snapshot` contains the updated board and revision.

## Errors

| Status | Meaning |
| --- | --- |
| `401 Unauthorized` | Invalid credentials or missing session on a protected route |
| `409 Conflict` | The board changed before a save could complete. Fetch the latest snapshot. |
| `422 Unprocessable Content` | The request body failed validation |
| `502 Bad Gateway` | OpenRouter failed or returned a reply or update the backend could not use |
| `503 Service Unavailable` | The OpenRouter key is missing |

Application errors include a `detail` message. FastAPI validation errors include a `detail` array with the invalid fields.
