"use client";

import { useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { KanbanColumn } from "@/components/KanbanColumn";
import { KanbanCardPreview } from "@/components/KanbanCardPreview";
import { createId, initialData, moveCard, type BoardData } from "@/lib/kanban";

type BoardUpdate = (board: BoardData) => BoardData;

type Props = {
  data?: BoardData;
  onUpdate?: (update: BoardUpdate, options?: { optimistic: boolean }) => Promise<boolean>;
  disabled?: boolean;
  controls?: ReactNode;
  sidebar?: ReactNode;
};

export const KanbanBoard = ({ data, onUpdate, disabled, controls, sidebar }: Props) => {
  const [demo, setDemo] = useState<BoardData>(initialData);
  const board = data ?? demo;
  const setBoard = onUpdate ?? setDemo;
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCardId(null);

    if (disabled || !over || active.id === over.id) {
      return;
    }

    const update: BoardUpdate = (prev) => ({
      ...prev,
      columns: moveCard(prev.columns, active.id as string, over.id as string),
    });
    if (onUpdate) {
      void onUpdate(update, { optimistic: true });
    } else {
      setDemo(update);
    }
  };

  const handleRenameColumn = (columnId: string, title: string) => {
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((column) =>
        column.id === columnId ? { ...column, title } : column
      ),
    }));
  };

  const handleAddCard = (columnId: string, title: string, details: string) => {
    const id = createId("card");
    return setBoard((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        [id]: { id, title, details: details || "No details yet." },
      },
      columns: prev.columns.map((column) =>
        column.id === columnId
          ? { ...column, cardIds: [...column.cardIds, id] }
          : column
      ),
    }));
  };

  const handleDeleteCard = (columnId: string, cardId: string) => {
    setBoard((prev) => {
      return {
        ...prev,
        cards: Object.fromEntries(
          Object.entries(prev.cards).filter(([id]) => id !== cardId)
        ),
        columns: prev.columns.map((column) =>
          column.id === columnId
            ? {
                ...column,
                cardIds: column.cardIds.filter((id) => id !== cardId),
              }
            : column
        ),
      };
    });
  };

  const handleEditCard = (cardId: string, title: string, details: string) => {
    return setBoard((prev) => ({
      ...prev,
      cards: { ...prev.cards, [cardId]: { id: cardId, title, details } },
    }));
  };

  const activeCard = activeCardId ? board.cards[activeCardId] : null;

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,_rgba(32,157,215,0.25)_0%,_rgba(32,157,215,0.05)_55%,_transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[520px] w-[520px] translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(circle,_rgba(117,57,145,0.18)_0%,_rgba(117,57,145,0.05)_55%,_transparent_75%)]" />

      <main className="relative mx-auto flex min-h-screen max-w-[1800px] flex-col gap-6 px-6 pb-16 pt-8">
        <header className="flex flex-col gap-6 rounded-[32px] border border-[var(--stroke)] bg-white/80 p-8 shadow-[var(--shadow)] backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <h1 className="font-display text-4xl font-semibold text-[var(--navy-dark)]">
                Kanban Studio
              </h1>
            </div>
            <div>{controls}</div>
          </div>
        </header>

        <div className={sidebar ? "grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]" : ""}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveCardId(null)}
          >
            <fieldset
              aria-label="Kanban board"
              disabled={disabled}
              className="min-w-0 overflow-x-auto pb-4"
            >
              <section className="grid min-w-[940px] grid-cols-5 gap-3">
                {board.columns.map((column) => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    cards={column.cardIds.map((cardId) => board.cards[cardId])}
                    onRename={handleRenameColumn}
                    onAddCard={handleAddCard}
                    onDeleteCard={handleDeleteCard}
                    onEditCard={handleEditCard}
                    disabled={disabled}
                  />
                ))}
              </section>
            </fieldset>
            <DragOverlay dropAnimation={null}>
              {activeCard && <KanbanCardPreview card={activeCard} />}
            </DragOverlay>
          </DndContext>
          {sidebar}
        </div>
      </main>
    </div>
  );
};
