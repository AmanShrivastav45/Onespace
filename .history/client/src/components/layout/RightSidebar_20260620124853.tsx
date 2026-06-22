// src/components/layout/RightSidebar.tsx
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiBellLine,
  RiStickyNoteLine,
  RiTaskLine,
  RiTicketLine,
} from 'react-icons/ri';
import type { IconType } from 'react-icons';
import { useSidebarCtx } from '../../context/SidebarContext';
import { useData } from '../../context/DataContext';
import type { ContextEntry, MiscTask, Ticket } from '../../types/resources';

interface FeedItem {
  id: string;
  type: 'ticket' | 'misc' | 'context';
  title: string;
  detail: string;
  at: string;
}

const TYPE_META: Record<FeedItem['type'], { icon: IconType; bg: string; fg: string }> = {
  ticket: { icon: RiTicketLine, bg: 'bg-primary/15', fg: 'text-primary' },
  misc: { icon: RiTaskLine, bg: 'bg-accent', fg: 'text-foreground' },
  context: { icon: RiStickyNoteLine, bg: 'bg-success/15', fg: 'text-success' },
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.max(0, Math.round(diffMs / 1000));
  if (diffSec < 60) return 'just now';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}

function buildFeed(tickets: Ticket[], miscTasks: MiscTask[], contextEntries: ContextEntry[]): FeedItem[] {
  const items: FeedItem[] = [
    ...tickets.map((t) => ({ id: t.id, type: 'ticket' as const, title: `${t.key} ${t.title}`, detail: t.status, at: t.updatedAt })),
    ...miscTasks.map((m) => ({ id: m.id, type: 'misc' as const, title: m.title, detail: m.status, at: m.updatedAt })),
    ...contextEntries.map((c) => ({ id: c.id, type: 'context' as const, title: c.title, detail: 'note', at: c.updatedAt })),
  ];
  return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 20);
}

export function RightSidebar() {
  const { isRightOpen, toggleRight } = useSidebarCtx();
  const { tickets, miscTasks, contextEntries } = useData();
  const feed = buildFeed(tickets, miscTasks, contextEntries);

  return (
    <aside className="flex flex-col h-full bg-sidebar border-l border-sidebar-border overflow-hidden">
      {/* Header */}
      <div
        className={`flex items-center h-14 px-3 border-b border-sidebar-border shrink-0 ${
          isRightOpen ? 'justify-between' : 'justify-center'
        }`}
      >
        <button
          onClick={toggleRight}
          className="p-1.5 rounded-md text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors shrink-0"
          aria-label={isRightOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isRightOpen ? (
            <RiArrowRightSLine className="text-[16px]" />
          ) : (
            <RiArrowLeftSLine className="text-[16px]" />
          )}
        </button>

        <div
          className={`flex items-center gap-2 overflow-hidden transition-[opacity,max-width] duration-200 ${
            isRightOpen ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'
          }`}
        >
          <RiBellLine className="text-muted-foreground shrink-0 text-[15px]" />
          <span className="text-sm font-semibold text-sidebar-foreground whitespace-nowrap tracking-tight">
            Recent Activity
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {feed.length === 0 ? (
          isRightOpen && (
            <p className="text-xs text-muted-foreground px-2 py-3">Nothing yet — create a ticket, task, or note.</p>
          )
        ) : isRightOpen ? (
          <ul className="flex flex-col gap-0.5">
            {feed.map((item) => {
              const meta = TYPE_META[item.type];
              const Icon = meta.icon;
              return (
                <li
                  key={`${item.type}-${item.id}`}
                  className="flex gap-2.5 px-2 py-2.5 rounded-md hover:bg-sidebar-accent transition-colors"
                >
                  <div className={`w-6 h-6 rounded-full ${meta.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className={`text-[12px] ${meta.fg}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-sidebar-foreground leading-relaxed truncate">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {item.detail} · {relativeTime(item.at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-2 pt-2">
            {feed.map((item) => {
              const meta = TYPE_META[item.type];
              const Icon = meta.icon;
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className={`w-6 h-6 rounded-full ${meta.bg} flex items-center justify-center`}
                  title={item.title}
                >
                  <Icon className={`text-[12px] ${meta.fg}`} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
