"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { addCard, deleteCard, moveCard, renameColumn, type Board, type Card } from "@/lib/board";
import { createInitialBoard } from "@/lib/initial-board";
import { CardPreview } from "./Card";
import { InteractiveColumn } from "./Column";

const COLUMN_IDS = new Set(["backlog", "ready", "progress", "review", "done"]);

const collisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  const hits = pointerHits.length > 0 ? pointerHits : closestCorners(args);
  const cardHit = hits.find((hit) => !COLUMN_IDS.has(String(hit.id)));
  return cardHit ? [cardHit] : hits;
};

export function Board() {
  const [board, setBoard] = useState<Board>(() => createInitialBoard());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const activeCard = useMemo(
    () => board.columns.flatMap((column) => column.cards).find((card) => card.id === activeId) ?? null,
    [activeId, board.columns],
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    setOverId(event.over ? String(event.over.id) : null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);
    if (!over || active.id === over.id) return;

    const cardId = String(active.id);
    const targetId = String(over.id);

    setBoard((current) => {
      const overColumn = current.columns.find((column) => column.id === targetId);
      if (overColumn) {
        return moveCard(current, cardId, overColumn.id, overColumn.cards.length);
      }

      const destination = current.columns.find((column) =>
        column.cards.some((card) => card.id === targetId),
      );
      if (!destination) return current;
      const index = destination.cards.findIndex((card) => card.id === targetId);
      return moveCard(current, cardId, destination.id, index);
    });
  }

  function handleDragCancel() {
    setActiveId(null);
    setOverId(null);
  }

  return (
    <div className="flex min-h-full flex-1 flex-col" data-testid="board">
      <header className="border-b-4 border-accent bg-white">
        <div className="mx-auto max-w-[1600px] px-6 py-6 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Single board</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">Project flow</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Drag work across five columns. Rename a column, add a card, or delete one.
          </p>
        </div>
      </header>
      <main className="flex-1 overflow-x-auto px-6 py-6 sm:px-8">
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="mx-auto flex min-w-max gap-4">
            {board.columns.map((column) => (
              <InteractiveColumn
                key={column.id}
                column={column}
                highlighted={isColumnTarget(column, overId, activeCard)}
                onRename={(columnId, title) => setBoard((current) => renameColumn(current, columnId, title))}
                onAdd={(columnId, title, details) =>
                  setBoard((current) => addCard(current, columnId, title, details))
                }
                onDelete={(cardId) => setBoard((current) => deleteCard(current, cardId))}
              />
            ))}
          </div>
          <DragOverlay>{activeCard ? <CardPreview card={activeCard} /> : null}</DragOverlay>
        </DndContext>
      </main>
    </div>
  );
}

function isColumnTarget(
  column: Board["columns"][number],
  overId: string | null,
  activeCard: Card | null,
) {
  if (!overId || !activeCard) return false;
  if (column.id === overId) return true;
  return column.cards.some((card) => card.id === overId);
}
