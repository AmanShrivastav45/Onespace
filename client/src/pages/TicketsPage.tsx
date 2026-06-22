// src/pages/TicketsPage.tsx
import { TicketBoard } from '../components/board/TicketBoard';
import { useData } from '../context/DataContext';

export default function TicketsPage() {
  const { tickets, ticketsController } = useData();

  return (
    <TicketBoard
      tickets={tickets}
      onCreate={ticketsController.create}
      emptyHint="No tickets yet — create your first Jira ticket to get started."
    />
  );
}
