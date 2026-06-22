// src/components/board/ResourceForm.tsx
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Status } from '../../types/resources';

export interface ResourceFormValues {
  key: string;
  title: string;
  description: string;
  status: Status;
}

interface ResourceFormProps {
  showKey: boolean;
  initial?: Partial<ResourceFormValues>;
  submitLabel: string;
  onSubmit: (values: ResourceFormValues) => Promise<void> | void;
}

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

export function ResourceForm({ showKey, initial, submitLabel, onSubmit }: ResourceFormProps) {
  const [key, setKey] = useState(initial?.key ?? '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [status, setStatus] = useState<Status>(initial?.status ?? 'todo');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || (showKey && !key.trim())) return;
    setSubmitting(true);
    try {
      await onSubmit({ key: key.trim(), title: title.trim(), description, status });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {showKey && (
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Key</label>
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="GEM-1234"
            className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground outline-none focus:border-ring placeholder:text-muted-foreground"
          />
        </div>
      )}

      <div>
        <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground outline-none focus:border-ring placeholder:text-muted-foreground"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Description"
          className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground outline-none focus:border-ring placeholder:text-muted-foreground resize-none"
        />
      </div>

      <div>
        <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Status)}
          className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 px-3 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary-active disabled:opacity-50 rounded-md transition-colors"
      >
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
