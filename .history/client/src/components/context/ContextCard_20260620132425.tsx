// src/components/context/ContextCard.tsx
import type { ContextEntry } from '../../types/resources';

interface ContextCardProps {
  entry: ContextEntry;
  onOpen: () => void;
}

export function ContextCard({ entry, onOpen }: ContextCardProps) {
  return (
    <li
      onClick={onOpen}
      className="bg-card border border-border rounded-sm px-4 py-3 hover:bg-accent/40 transition-colors cursor-pointer flex flex-col gap-2"
    >
      <p className="text-sm font-medium text-foreground">{entry.title}</p>
      {entry.description && <p className="text-xs text-muted-foreground line-clamp-2">{entry.description}</p>}
      {entry.summary && <p className="text-xs text-muted-foreground/80 italic line-clamp-2">{entry.summary}</p>}
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="bg-accent text-foreground text-[10px] font-semibold uppercase tracking-wide rounded-pill px-2.5 py-1"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </li>
  );
}
