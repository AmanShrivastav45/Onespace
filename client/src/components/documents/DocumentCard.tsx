// src/components/documents/DocumentCard.tsx
import { useNavigate } from 'react-router-dom';
import type { Document } from '../../types/resources';

function toSnippet(markdown: string, maxLength = 120): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^(.+)\n[=-]{3,}\s*$/gm, '$1')
    .replace(/^[\s|:-]+$/gm, ' ')
    .replace(/\|/g, ' ')
    .replace(/^[-*+>]\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).trimEnd()}…`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

interface DocumentCardProps {
  doc: Document;
}

export function DocumentCard({ doc }: DocumentCardProps) {
  const navigate = useNavigate();
  const snippet = toSnippet(doc.content);

  return (
    <li
      onClick={() => navigate(`/documents/${doc.id}`)}
      className="bg-card border border-border rounded-sm p-4 hover:bg-accent/40 transition-colors cursor-pointer flex flex-col gap-2 min-h-[140px]"
    >
      <p className="text-sm font-normal text-foreground line-clamp-2">{doc.title}</p>
      <p className="text-xs text-muted-foreground line-clamp-3 flex-1">{snippet || 'Empty document.'}</p>
      <p className="text-[10px] text-muted-foreground/80 pt-2 border-t border-border">Updated {formatDate(doc.updatedAt)}</p>
    </li>
  );
}
