import { useState, type FormEvent, type ReactNode, type Ref } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Column } from "@/lib/board";
import { CardView } from "./Card";

type ColumnHandlers = {
  column: Column;
  highlighted: boolean;
  onRename: (columnId: string, title: string) => void;
  onAdd: (columnId: string, title: string, details: string) => void;
  onDelete: (cardId: string) => void;
};

export function ColumnView({
  column,
  highlighted,
  onRename,
  onAdd,
  dropRef,
  children,
}: ColumnHandlers & { dropRef?: Ref<HTMLElement>; children: ReactNode }) {
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTitle = title.trim();
    const nextDetails = details.trim();
    if (!nextTitle || !nextDetails) return;
    onAdd(column.id, nextTitle, nextDetails);
    setTitle("");
    setDetails("");
    setComposing(false);
  }

  return (
    <section
      ref={dropRef}
      data-testid={`column-${column.id}`}
      className={`flex max-h-[calc(100vh-9rem)] w-[300px] shrink-0 flex-col rounded-2xl border bg-white shadow-[0_12px_32px_rgba(3,33,71,0.06)] ${
        highlighted ? "border-primary" : "border-line"
      }`}
    >
      <header className="border-b border-line px-4 py-3">
        <input
          aria-label={`Rename ${column.title}`}
          data-testid={`column-title-${column.id}`}
          value={column.title}
          onChange={(event) => onRename(column.id, event.target.value)}
          className="w-full bg-transparent text-base font-semibold text-navy outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        <p className="mt-1 text-xs text-muted">
          {column.cards.length} {column.cards.length === 1 ? "card" : "cards"}
        </p>
      </header>
      <div className="flex min-h-[280px] flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
        {children}
        {column.cards.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-muted">Drop a card here</p>
        ) : null}
      </div>
      <footer className="border-t border-line px-3 py-3">
        {composing ? (
          <form onSubmit={submit} className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted" htmlFor={`title-${column.id}`}>
              Title
            </label>
            <input
              id={`title-${column.id}`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="rounded-lg border border-line px-3 py-2 text-sm text-navy outline-none focus:border-primary"
            />
            <label className="text-xs font-medium text-muted" htmlFor={`details-${column.id}`}>
              Details
            </label>
            <textarea
              id={`details-${column.id}`}
              value={details}
              rows={3}
              onChange={(event) => setDetails(event.target.value)}
              className="resize-none rounded-lg border border-line px-3 py-2 text-sm text-navy outline-none focus:border-primary"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-white hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-40"
                disabled={!title.trim() || !details.trim()}
              >
                Add
              </button>
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-navy"
                onClick={() => {
                  setComposing(false);
                  setTitle("");
                  setDetails("");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            className="w-full rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-white hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onClick={() => setComposing(true)}
          >
            Add card
          </button>
        )}
      </footer>
    </section>
  );
}

export function InteractiveColumn(props: ColumnHandlers) {
  const { setNodeRef } = useDroppable({ id: props.column.id });

  return (
    <ColumnView {...props} dropRef={setNodeRef}>
      <SortableContext
        items={props.column.cards.map((card) => card.id)}
        strategy={verticalListSortingStrategy}
      >
        {props.column.cards.map((card) => (
          <CardView key={card.id} card={card} onDelete={props.onDelete} />
        ))}
      </SortableContext>
    </ColumnView>
  );
}
