// src/components/board/ResourceCard.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RiDraggable } from 'react-icons/ri';
import { StatusBadge } from '../ui/StatusBadge';
import type { BoardItem } from './ResourceBoard';

interface ResourceCardProps<T extends BoardItem> {
  item: T;
  showKey: boolean;
  onOpen: () => void;
}

export function ResourceCard<T extends BoardItem>({ item, showKey, onOpen }: ResourceCardProps<T>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const done = item.checklist.filter((c) => c.done).length;
  const total = item.checklist.length;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3 hover:bg-accent/40 transition-colors cursor-pointer"
      onClick={onOpen}
    >
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="text-muted-foreground hover:text-foreground cursor-grab shrink-0"
        aria-label="Drag to reorder"
      >
        <RiDraggable className="text-[16px]" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {showKey && item.key && (
            <span className="text-[11px] font-mono text-muted-foreground shrink-0">{item.key}</span>
          )}
          <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
        </div>
        {item.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>}
      </div>

      {total > 0 && (
        <span className="text-[11px] text-muted-foreground shrink-0">
          {done}/{total}
        </span>
      )}

      <StatusBadge status={item.status} />
    </li>
  );
}
