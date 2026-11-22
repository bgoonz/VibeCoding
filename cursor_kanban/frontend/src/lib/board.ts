export type Card = {
  id: string;
  title: string;
  details: string;
};

export type Column = {
  id: string;
  title: string;
  cards: Card[];
};

export type Board = {
  columns: Column[];
};

export function renameColumn(board: Board, columnId: string, title: string): Board {
  if (!board.columns.some((column) => column.id === columnId)) return board;

  return {
    columns: board.columns.map((column) =>
      column.id === columnId ? { ...column, title } : column,
    ),
  };
}

export function addCard(
  board: Board,
  columnId: string,
  title: string,
  details: string,
  id = crypto.randomUUID(),
): Board {
  if (!board.columns.some((column) => column.id === columnId)) return board;

  const card: Card = { id, title, details };

  return {
    columns: board.columns.map((column) =>
      column.id === columnId ? { ...column, cards: [...column.cards, card] } : column,
    ),
  };
}

export function deleteCard(board: Board, cardId: string): Board {
  if (!board.columns.some((column) => column.cards.some((card) => card.id === cardId))) {
    return board;
  }

  return {
    columns: board.columns.map((column) => ({
      ...column,
      cards: column.cards.filter((card) => card.id !== cardId),
    })),
  };
}

export function moveCard(
  board: Board,
  cardId: string,
  toColumnId: string,
  toIndex: number,
): Board {
  const fromColumn = board.columns.find((column) =>
    column.cards.some((card) => card.id === cardId),
  );
  const toColumn = board.columns.find((column) => column.id === toColumnId);
  if (!fromColumn || !toColumn) return board;

  const fromIndex = fromColumn.cards.findIndex((card) => card.id === cardId);

  if (fromColumn.id === toColumn.id) {
    if (fromIndex === toIndex) return board;
    return {
      columns: board.columns.map((column) =>
        column.id === fromColumn.id
          ? { ...column, cards: arrayMove(column.cards, fromIndex, toIndex) }
          : column,
      ),
    };
  }

  const card = fromColumn.cards[fromIndex];
  const index = Math.max(0, Math.min(toIndex, toColumn.cards.length));

  return {
    columns: board.columns.map((column) => {
      if (column.id === fromColumn.id) {
        return { ...column, cards: column.cards.filter((item) => item.id !== cardId) };
      }
      if (column.id === toColumn.id) {
        const cards = [...column.cards];
        cards.splice(index, 0, card);
        return { ...column, cards };
      }
      return column;
    }),
  };
}

function arrayMove<T>(items: T[], from: number, to: number): T[] {
  const next = items.slice();
  const [item] = next.splice(from, 1);
  const index = Math.max(0, Math.min(to, next.length));
  next.splice(index, 0, item);
  return next;
}
