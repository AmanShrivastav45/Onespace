// src/components/layout/MainContent.tsx
import { Link, Outlet, useLocation, useParams } from 'react-router-dom';
import { RiArrowLeftLine } from 'react-icons/ri';
import { useData } from '../../context/DataContext';

const PAGE_META: Record<string, { title: string; crumb: string }> = {
  '/tickets': { title: 'Jira Tickets', crumb: 'TaskBoard / Jira Tickets' },
  '/misc': { title: 'Miscellaneous Tasks', crumb: 'TaskBoard / Miscellaneous Tasks' },
  '/context': { title: 'Context', crumb: 'TaskBoard / Context' },
  '/documents': { title: 'Documents', crumb: 'TaskBoard / Documents' },
};

export function MainContent() {
  const { pathname } = useLocation();
  const { ticketId, documentId } = useParams();
  const { tickets, documents } = useData();

  let title = 'Page';
  let crumb = 'TaskBoard';
  const backTo = ticketId ? '/tickets' : documentId ? '/documents' : null;

  if (ticketId) {
    const ticket = tickets.find((t) => t.id === ticketId);
    title = ticket ? `${ticket.key} ${ticket.title}` : 'Ticket';
    crumb = 'TaskBoard / Jira Tickets';
  } else if (documentId) {
    const doc = documents.find((d) => d.id === documentId);
    title = doc ? doc.title : 'Document';
    crumb = 'TaskBoard / Documents';
  } else {
    const meta = PAGE_META[pathname] ?? { title: 'Page', crumb: 'TaskBoard' };
    title = meta.title;
    crumb = meta.crumb;
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header bar */}
      <header className="flex items-center justify-between px-6 h-14 border-b border-border shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {backTo && (
            <Link
              to={backTo}
              className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
              aria-label={documentId ? 'Back to Documents' : 'Back to Jira Tickets'}
            >
              <RiArrowLeftLine className="text-[16px]" />
            </Link>
          )}
          <div className="min-w-0">
            <h1 className="text-sm font-normal text-foreground tracking-tight truncate">{title}</h1>
            <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-muted-foreground mt-1">{crumb}</p>
          </div>
        </div>
      </header>

      {/* Page content — scrollable */}
      <main className="flex-1 overflow-y-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
