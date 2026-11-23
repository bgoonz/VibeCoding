from pathlib import Path

from ai import ChatRequest, chat, completion
from board import Board

answer = completion([{"role": "user", "content": "What is 2+2? Answer with only the digit."}])
if answer.strip() != "4":
    raise SystemExit("Unexpected OpenRouter answer")
print("OpenRouter answered 4.")

seed = Board.model_validate_json(Path(__file__).with_name("seed.json").read_text(encoding="utf-8"))
reply, updated = chat(seed, ChatRequest(message="Create a card named Connectivity check in Backlog.", history=[]))
if updated is None or not any(
    updated.cards[card_id].title == "Connectivity check" for card_id in updated.columns[0].cardIds
):
    raise SystemExit("Unexpected structured update")
print("OpenRouter returned a valid structured card update.")
