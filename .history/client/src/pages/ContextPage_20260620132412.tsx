// src/pages/ContextPage.tsx
import { useMemo, useState } from 'react';
import { RiAddLine, RiSearchLine } from 'react-icons/ri';
import { useData } from '../context/DataContext';
import { ContextCard } from '../components/context/ContextCard';
import { ContextForm } from '../components/context/ContextForm';
import { ContextDetailModal } from '../components/context/ContextDetailModal';
import { Modal } from '../components/ui/Modal';

export default function ContextPage() {
  const { contextEntries, contextController } = useData();
  const [tagFilter, setTagFilter] = useState('');
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = tagFilter.trim().toLowerCase();
    if (!needle) return contextEntries;
    return contextEntries.filter((entry) => entry.tags.some((tag) => tag.toLowerCase().includes(needle)));
  }, [contextEntries, tagFilter]);

  const activeEntry = contextEntries.find((e) => e.id === activeId) ?? null;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[14px]" />
          <input
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            placeholder="Filter by tag…"
            className="w-full h-10 bg-card border border-border rounded-sm pl-9 pr-3 text-sm text-foreground outline-none focus:border-ring placeholder:text-muted-foreground"
          />
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary-active rounded-sm transition-colors shrink-0"
        >
          <RiAddLine className="text-[14px]" />
          New Entry
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-border rounded-sm py-12 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            {contextEntries.length === 0
              ? 'No context notes yet — capture your first one.'
              : 'No entries match that tag.'}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {filtered.map((entry) => (
            <ContextCard key={entry.id} entry={entry} onOpen={() => setActiveId(entry.id)} />
          ))}
        </ul>
      )}

      {isCreateOpen && (
        <Modal title="New Context Entry" onClose={() => setCreateOpen(false)}>
          <ContextForm
            submitLabel="Create"
            onSubmit={async (values) => {
              await contextController.create(values);
              setCreateOpen(false);
            }}
          />
        </Modal>
      )}

      {activeEntry && (
        <ContextDetailModal
          entry={activeEntry}
          onClose={() => setActiveId(null)}
          onUpdate={contextController.update}
          onDelete={contextController.remove}
        />
      )}
    </div>
  );
}
