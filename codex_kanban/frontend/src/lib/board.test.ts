import { describe, expect, it } from "vitest";
import { addCard, deleteCard, moveCard, renameColumn } from "./board";
import { createInitialBoard } from "./initial-board";

function sampleBoard() {
  return createInitialBoard();
}

describe("initial board", () => {
  it("opens with one board of five columns and titled cards", () => {
    const board = sampleBoard();

    expect(board.columns).toHaveLength(5);
    expect(board.columns.map((column) => column.title)).toEqual([
      "Backlog",
      "Ready",
      "In Progress",
      "Review",
      "Done",
    ]);

    for (const column of board.columns) {
      expect(column.cards.length).toBeGreaterThan(0);
      for (const card of column.cards) {
        expect(card.title.trim().length).toBeGreaterThan(0);
        expect(card.details.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe("renameColumn", () => {
  it("renames only the matching column", () => {
    const board = renameColumn(sampleBoard(), "backlog", "Icebox");

    expect(board.columns[0].title).toBe("Icebox");
    expect(board.columns[1].title).toBe("Ready");
  });

  it("leaves the board unchanged when the column does not exist", () => {
    const board = sampleBoard();
    expect(renameColumn(board, "missing", "Later")).toBe(board);
  });
});

describe("addCard", () => {
  it("appends a card to the chosen column", () => {
    const board = addCard(sampleBoard(), "review", "Ship notes", "Write the Friday note.", "notes");
    const review = board.columns.find((column) => column.id === "review");

    expect(review?.cards.map((card) => card.id)).toEqual(["a11y", "notes"]);
    expect(review?.cards[1]).toEqual({
      id: "notes",
      title: "Ship notes",
      details: "Write the Friday note.",
    });
    expect(board.columns.find((column) => column.id === "done")?.cards).toHaveLength(2);
  });

  it("leaves the board unchanged when the column does not exist", () => {
    const board = sampleBoard();
    expect(addCard(board, "missing", "Title", "Details", "x")).toBe(board);
  });
});

describe("deleteCard", () => {
  it("removes a card from its column", () => {
    const board = deleteCard(sampleBoard(), "billing");
    const backlog = board.columns.find((column) => column.id === "backlog");

    expect(backlog?.cards.map((card) => card.id)).toEqual(["onboarding"]);
  });

  it("leaves the board unchanged when the card does not exist", () => {
    const board = sampleBoard();
    expect(deleteCard(board, "missing")).toBe(board);
  });
});

describe("moveCard", () => {
  it("moves a card onto another column at the requested index", () => {
    const board = moveCard(sampleBoard(), "onboarding", "review", 0);
    const backlog = board.columns.find((column) => column.id === "backlog");
    const review = board.columns.find((column) => column.id === "review");

    expect(backlog?.cards.map((card) => card.id)).toEqual(["billing"]);
    expect(review?.cards.map((card) => card.id)).toEqual(["onboarding", "a11y"]);
  });

  it("appends when the index is past the end of the destination", () => {
    const board = moveCard(sampleBoard(), "tokens", "backlog", 20);

    expect(board.columns[0].cards.map((card) => card.id)).toEqual([
      "onboarding",
      "billing",
      "tokens",
    ]);
    expect(board.columns[4].cards.map((card) => card.id)).toEqual(["scaffold"]);
  });

  it("reorders a card within its column", () => {
    const down = moveCard(sampleBoard(), "onboarding", "backlog", 1);
    expect(down.columns[0].cards.map((card) => card.id)).toEqual(["billing", "onboarding"]);

    const up = moveCard(sampleBoard(), "scaffold", "done", 0);
    expect(up.columns[4].cards.map((card) => card.id)).toEqual(["scaffold", "tokens"]);
  });

  it("drops a card into an empty column", () => {
    const cleared = deleteCard(sampleBoard(), "a11y");
    const board = moveCard(cleared, "digest", "review", 0);

    expect(board.columns.find((column) => column.id === "ready")?.cards.map((card) => card.id)).toEqual([
      "empty-states",
    ]);
    expect(board.columns.find((column) => column.id === "review")?.cards.map((card) => card.id)).toEqual([
      "digest",
    ]);
  });

  it("leaves the board unchanged when the move is a no-op or the ids are unknown", () => {
    const board = sampleBoard();
    expect(moveCard(board, "onboarding", "backlog", 0)).toBe(board);
    expect(moveCard(board, "missing", "review", 0)).toBe(board);
    expect(moveCard(board, "onboarding", "missing", 0)).toBe(board);
  });
});
