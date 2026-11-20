import type { HTMLAttributes, Ref } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card } from "@/lib/board";

type CardBodyProps = {
  card: Card;
  onDelete: (cardId: string) => void;
  ref?: Ref<HTMLElement>;
} & HTMLAttributes<HTMLElement>;

export function CardBody({ card, onDelete, className = "", ref, ...props }: CardBodyProps) {
  return (
    <article
      ref={ref}
      className={`rounded-xl border border-line border-l-4 border-l-accent bg-white px-3 py-3 shadow-[0_8px_20px_rgba(3,33,71,0.05)] ${className}`}
      data-testid={`card-${card.id}`}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold leading-5 text-navy">{card.title}</h3>
        <button
          type="button"
          aria-label={`Delete ${card.title}`}
          className="shrink-0 text-xs font-medium text-muted hover:text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onDelete(card.id)}
        >
          Delete
        </button>
      </div>
      <p className="mt-2 text-sm leading-5 text-muted">{card.details}</p>
    </article>
  );
}

export function CardView({ card, onDelete }: { card: Card; onDelete: (cardId: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  return (
    <CardBody
      ref={setNodeRef}
      card={card}
      onDelete={onDelete}
      className={`cursor-grab touch-none active:cursor-grabbing ${isDragging ? "opacity-40" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      aria-label={card.title}
    />
  );
}

export function CardPreview({ card }: { card: Card }) {
  return (
    <article className="w-[276px] cursor-grabbing rounded-xl border border-line border-l-4 border-l-accent bg-white px-3 py-3 shadow-[0_18px_40px_rgba(3,33,71,0.18)]">
      <h3 className="text-sm font-semibold leading-5 text-navy">{card.title}</h3>
      <p className="mt-2 text-sm leading-5 text-muted">{card.details}</p>
    </article>
  );
}
