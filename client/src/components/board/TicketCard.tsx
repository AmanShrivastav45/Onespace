// src/components/board/TicketCard.tsx
import { useNavigate } from 'react-router-dom';
import type { Priority, Ticket } from '../../types/resources';
import { StatusBadge } from '../ui/StatusBadge';

const PRIORITY_META: Record<Priority, string> = {
  Highest: 'bg-destructive/15 text-destructive',
  High: 'bg-destructive/15 text-destructive',
  Medium: 'bg-warning/15 text-warning',
  Low: 'bg-secondary text-muted-foreground',
  Lowest: 'bg-secondary text-muted-foreground',
};

interface TicketCardProps {
  ticket: Ticket;
}

export function TicketCard({ ticket }: TicketCardProps) {
  const navigate = useNavigate();
  const visibleComponents = ticket.components.slice(0, 2);
  const extraComponents = ticket.components.length - visibleComponents.length;

  return (
    <li
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      className="bg-card border border-border rounded-sm p-4 hover:bg-accent/40 transition-colors cursor-pointer flex flex-col gap-3"
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`px-2.5 py-1 rounded-pill text-[10px] font-normal uppercase tracking-[0.1em] shrink-0 ${PRIORITY_META[ticket.priority]}`}
        >
          {ticket.priority}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground shrink-0">{ticket.key}</span>
      </div>

      <p className="text-sm font-normal text-foreground line-clamp-2 min-h-[2.5em]">{ticket.title}</p>

      <div className="flex flex-wrap gap-1.5 min-h-[22px]">
        {visibleComponents.map((c) => (
          <span
            key={c}
            className="bg-accent text-foreground font-mono text-[10px] uppercase tracking-[0.1em] rounded-pill px-2.5 py-1"
          >
            {c}
          </span>
        ))}
        {extraComponents > 0 && <span className="text-[10px] font-mono text-muted-foreground px-1 py-1">+{extraComponents}</span>}
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
        <div className="min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/80">Fix version</p>
          <p className="text-xs text-foreground truncate">{ticket.fixVersion || '—'}</p>
        </div>
        <StatusBadge status={ticket.status} />
      </div>
    </li>
  );
}
