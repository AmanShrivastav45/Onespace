// src/components/documents/DocumentForm.tsx
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { Document } from '../../types/resources';

export interface DocumentFormValues {
  title: string;
  filename: string;
  content: string;
}

interface DocumentFormProps {
  initial?: Partial<Document>;
  submitLabel: string;
  onSubmit: (values: DocumentFormValues) => Promise<void> | void;
}

const inputClass =
  'w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-ring placeholder:text-muted-foreground';
const labelClass = 'block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-1.5';

function titleFromFilename(name: string): string {
  return name.replace(/\.(md|markdown)$/i, '');
}

export function DocumentForm({ initial, submitLabel, onSubmit }: DocumentFormProps) {
  const isEdit = initial !== undefined;
  const [title, setTitle] = useState(initial?.title ?? '');
  const [filename, setFilename] = useState(initial?.filename ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [submitting, setSubmitting] = useState(false);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setFilename(file.name);
    setContent(text);
    if (!title.trim()) setTitle(titleFromFilename(file.name));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), filename, content });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {!isEdit && (
        <div>
          <label className={labelClass}>Markdown file</label>
          <input type="file" accept=".md,.markdown" onChange={(e) => void handleFileChange(e)} className={inputClass} />
        </div>
      )}

      <div>
        <label className={labelClass}>Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className={inputClass}
          autoFocus={isEdit}
        />
      </div>

      {isEdit && (
        <div>
          <label className={labelClass}>Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            placeholder="Markdown content"
            className={`${inputClass} font-mono resize-none`}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !title.trim()}
        className="mt-1 px-3 py-2 text-sm font-normal text-primary-foreground bg-primary hover:bg-primary-active disabled:opacity-50 rounded-pill transition-colors"
      >
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
