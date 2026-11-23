import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { useState } from "react";
import type { Card } from "@/lib/kanban";

type KanbanCardProps = {
  card: Card;
  onDelete: (cardId: string) => void;
  onEdit: (cardId: string, title: string, details: string) => void | Promise<boolean>;
  disabled?: boolean;
};

export const KanbanCard = ({ card, onDelete, onEdit, disabled }: KanbanCardProps) => {
  const [editing, setEditing] = useState(false);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id, disabled: disabled || editing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={clsx(
        "rounded-2xl border border-transparent bg-white px-4 py-4 shadow-[0_12px_24px_rgba(3,33,71,0.08)]",
        "transition-shadow duration-150",
        isDragging && "opacity-0"
      )}
      data-testid={`card-${card.id}`}
    >
      {editing ? (
        <form
          className="grid gap-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const title = String(form.get("title")).trim();
            if (!title) return;
            if (await onEdit(card.id, title, String(form.get("details")).trim()) !== false) {
              setEditing(false);
            }
          }}
        >
          <label className="text-sm">
            Card title
            <input className="workspace-input" name="title" defaultValue={card.title} required />
          </label>
          <label className="text-sm">
            Details
            <textarea className="workspace-input" name="details" defaultValue={card.details} />
          </label>
          <button className="workspace-primary text-sm">Save</button>
          <button type="button" className="workspace-secondary" onClick={() => setEditing(false)}>Cancel</button>
        </form>
      ) : (
        <>
          <div
            className="cursor-grab touch-none break-words"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Drag ${card.title}`}
          >
            <h4 className="font-display text-base font-semibold text-[var(--navy-dark)]">
              {card.title}
            </h4>
            <p className="mt-2 text-sm leading-6 text-slate-600">{card.details}</p>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="px-2 py-1 text-xs font-semibold text-[var(--secondary-purple)]"
              onClick={() => setEditing(true)}
              aria-label={`Edit ${card.title}`}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(card.id)}
              className="rounded-full border border-transparent px-2 py-1 text-xs font-semibold text-slate-600 transition hover:border-[var(--stroke)] hover:text-[var(--navy-dark)]"
              aria-label={`Delete ${card.title}`}
            >
              Remove
            </button>
          </div>
        </>
      )}
    </article>
  );
};
