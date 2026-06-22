// src/components/board/TicketBoard.tsx
import { useMemo, useState } from 'react';
import { RiAddLine } from 'react-icons/ri';
import { Modal } from '../ui/Modal';
import { TicketCard } from './TicketCard';
import { TicketForm } from './TicketForm';
import type { Ticket } from '../../types/resources';
import type { TicketCreate } from '../../api/tickets';

interface TicketBoardProps {
  tickets: Ticket[];
  onCreate: (data: TicketCreate) => Promise<Ticket>;
  emptyHint: string;
}

export function TicketBoard({ tickets, onCreate, emptyHint }: TicketBoardProps) {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const sorted = useMemo(() => [...tickets].sort((a, b) => a.order - b.order), [tickets]);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-normal text-primary-foreground bg-primary hover:bg-primary-active rounded-pill transition-colors"
        >
          <RiAddLine className="text-[14px]" />
          New Ticket
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="border border-dashed border-border rounded-sm py-12 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">{emptyHint}</p>
        </div>
      ) : (
        <ul className="grid grid-cols-3 gap-3">
          {sorted.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </ul>
      )}

      {isCreateOpen && (
        <Modal title="New Jira Ticket" onClose={() => setCreateOpen(false)} widthClassName="max-w-xl">
          <TicketForm
            submitLabel="Create"
            onSubmit={async (values) => {
              await onCreate(values);
              setCreateOpen(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
