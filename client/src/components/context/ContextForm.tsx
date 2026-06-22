// src/components/context/ContextForm.tsx
import { useState } from 'react';
import type { FormEvent } from 'react';

export interface ContextFormValues {
  title: string;
  description: string;
  summary: string;
  tags: string[];
}

interface ContextFormProps {
  initial?: Partial<ContextFormValues>;
  submitLabel: string;
  onSubmit: (values: ContextFormValues) => Promise<void> | void;
}

export function ContextForm({ initial, submitLabel, onSubmit }: ContextFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [summary, setSummary] = useState(initial?.summary ?? '');
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(', '));
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const tags = Array.from(
      new Set(
        tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      ),
    );
    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), description, summary, tags });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-1.5">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-ring placeholder:text-muted-foreground"
          autoFocus
        />
      </div>

      <div>
        <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="What is this about?"
          className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-ring placeholder:text-muted-foreground resize-none"
        />
      </div>

      <div>
        <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-1.5">Summary</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={2}
          placeholder="Your own understanding of this note"
          className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-ring placeholder:text-muted-foreground resize-none"
        />
      </div>

      <div>
        <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-1.5">Tags</label>
        <input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="comma, separated, tags"
          className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-ring placeholder:text-muted-foreground"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 px-3 py-2 text-sm font-normal text-primary-foreground bg-primary hover:bg-primary-active disabled:opacity-50 rounded-pill transition-colors"
      >
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
