"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { addCard, deleteCard, moveCard, renameColumn, type Board, type Card } from "@/lib/board";
import { createInitialBoard } from "@/lib/initial-board";
import { CardPreview } from "./Card";
import { InteractiveColumn } from "./Column";

const COLUMN_IDS = new Set(["backlog", "ready", "progress", "review", "done"]);

const collisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args).filter((hit) => hit.id !== args.active.id);
  const hits = args.pointerCoordinates ? pointerHits : closestCorners(args);
  const cardHit = hits.find((hit) => !COLUMN_IDS.has(String(hit.id)));
  return cardHit ? [cardHit] : hits;
};

export function Board() {
  const [board, setBoard] = useState<Board>(() => createInitialBoard());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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
      <header className="border-b border-white/10 bg-navy text-white">
        <div className="mx-auto flex max-w-[1680px] items-center gap-3 px-5 py-4 sm:px-9">
          <span aria-hidden="true" className="flex size-8 items-center justify-center gap-0.5 rounded-lg bg-accent">
            <span className="h-3 w-0.5 rounded bg-navy"></span>
            <span className="h-4 w-0.5 rounded bg-navy"></span>
            <span className="h-2 w-0.5 rounded bg-navy"></span>
          </span>
          <span className="text-base font-semibold tracking-tight">Kanban</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1680px] flex-1 px-5 pt-9 sm:px-9 sm:pt-12">
        <h1 className="text-4xl font-bold tracking-tight text-navy sm:text-5xl">Project flow</h1>
        <p className="mt-3 text-sm text-slate-600">Drag cards to move them. Select a column name to rename it.</p>
        <DndContext id="project-flow"
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="mt-7 overflow-x-auto pb-8"><div className="grid grid-cols-[repeat(5,minmax(220px,1fr))] gap-3.5">
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

