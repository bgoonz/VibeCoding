import sqlite3
from contextlib import closing

from pydantic import BaseModel, ConfigDict, Field, model_validator


class Model(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Card(Model):
    id: str
    title: str = Field(min_length=1)
    details: str


class Column(Model):
    id: str
    title: str
    cardIds: list[str]


COLUMN_IDS = ["col-backlog", "col-discovery", "col-progress", "col-review", "col-done"]


class Board(Model):
    columns: list[Column]
    cards: dict[str, Card]

    @model_validator(mode="after")
    def validate_board(self):
        if [column.id for column in self.columns] != COLUMN_IDS:
            raise ValueError("The five column IDs and their order are fixed")
        ids = [card_id for column in self.columns for card_id in column.cardIds]
        if len(ids) != len(self.cards) or set(ids) != self.cards.keys():
            raise ValueError("Every card must appear in exactly one column")
        if self.cards.keys() & set(COLUMN_IDS):
            raise ValueError("Card IDs must differ from column IDs")
        if any(key != card.id for key, card in self.cards.items()):
            raise ValueError("Card keys must match their IDs")
        return self


class Snapshot(Model):
    board: Board
    revision: int = Field(ge=0)


def connect(path):
    connection = sqlite3.connect(path)
    connection.execute("PRAGMA foreign_keys = ON")
    return closing(connection)


def initialize(path, seed):
    with connect(path) as db, db:
        db.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                username TEXT NOT NULL UNIQUE
            );
            CREATE TABLE IF NOT EXISTS boards (
                user_id INTEGER PRIMARY KEY REFERENCES users(id),
                board_json TEXT NOT NULL CHECK (json_valid(board_json)),
                revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0)
            );
        """)
        db.execute("INSERT OR IGNORE INTO users(username) VALUES ('user')")
        db.execute("""
            INSERT OR IGNORE INTO boards(user_id, board_json)
            SELECT id, ? FROM users WHERE username = 'user'
        """, (seed.model_dump_json(),))


def user_id(path, username):
    with connect(path) as db:
        return db.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()[0]


def load_board(path, owner):
    with connect(path) as db:
        board_json, revision = db.execute(
            "SELECT board_json, revision FROM boards WHERE user_id = ?", (owner,)
        ).fetchone()
    return Snapshot(board=Board.model_validate_json(board_json), revision=revision)


def save_board(path, owner, snapshot):
    with connect(path) as db, db:
        result = db.execute("""
            UPDATE boards SET board_json = ?, revision = revision + 1
            WHERE user_id = ? AND revision = ?
        """, (snapshot.board.model_dump_json(), owner, snapshot.revision))
        if result.rowcount:
            return Snapshot(board=snapshot.board, revision=snapshot.revision + 1)
    return None
