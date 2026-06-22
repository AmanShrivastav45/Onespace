// src/components/ui/StatusBadge.tsx
import type { Status } from '../../types/resources';

const STATUS_META: Record<Status, { label: string; className: string }> = {
  todo: { label: 'To Do', className: 'bg-secondary text-muted-foreground' },
  in_progress: { label: 'In Progress', className: 'bg-info/15 text-info' },
  done: { label: 'Done', className: 'bg-success/15 text-success' },
};

export function StatusBadge({ status }: { status: Status }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`shrink-0 px-2.5 py-1 rounded-pill text-[10px] font-normal uppercase tracking-[0.1em] ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}
