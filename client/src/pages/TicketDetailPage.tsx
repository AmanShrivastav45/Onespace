// src/pages/TicketDetailPage.tsx
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RiAddLine, RiAttachment2, RiDeleteBinLine, RiExternalLinkLine, RiPencilLine } from 'react-icons/ri';
import { useData } from '../context/DataContext';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';
import { TicketForm } from '../components/board/TicketForm';
import type { Priority, Resolution, Status } from '../types/resources';

const inputClass =
  'w-full bg-card border border-border rounded-sm px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring placeholder:text-muted-foreground';

const RESOLUTION_OPTIONS: Resolution[] = ['Unresolved', 'Resolved', "Won't Fix", 'Duplicate', 'Cannot Reproduce'];
const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_META: Record<Priority, string> = {
  Highest: 'text-destructive',
  High: 'text-destructive',
  Medium: 'text-warning',
  Low: 'text-muted-foreground',
  Lowest: 'text-muted-foreground',
};

type Tab = 'comments' | 'worklog' | 'history' | 'activity';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function formatSize(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb.toFixed(1)} KB`;
}

export default function TicketDetailPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { tickets, ticketsController, loading, addTicketComment, addTicketSubtask, toggleTicketSubtask } = useData();
  const [isEditOpen, setEditOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [tab, setTab] = useState<Tab>('comments');
  const [draftComment, setDraftComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [subtaskJiraLink, setSubtaskJiraLink] = useState('');
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskDescription, setSubtaskDescription] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);

  const ticket = tickets.find((t) => t.id === ticketId);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (!ticket) {
    return (
      <div className="border border-dashed border-border rounded-sm py-12 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Ticket not found.</p>
      </div>
    );
  }

  async function submitComment() {
    const body = draftComment.trim();
    if (!body || !ticket) return;
    setPostingComment(true);
    try {
      await addTicketComment(ticket.id, body);
      setDraftComment('');
    } finally {
      setPostingComment(false);
    }
  }

  async function submitSubtask() {
    const title = subtaskTitle.trim();
    if (!title || !ticket) return;
    setAddingSubtask(true);
    try {
      await addTicketSubtask(ticket.id, {
        jiraLink: subtaskJiraLink.trim(),
        title,
        description: subtaskDescription.trim(),
      });
      setSubtaskJiraLink('');
      setSubtaskTitle('');
      setSubtaskDescription('');
      setShowAddSubtask(false);
    } finally {
      setAddingSubtask(false);
    }
  }

  return (
    <div className="flex gap-5">
      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col gap-5">
        <div>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h1 className="text-lg font-normal text-foreground">
              <span className="font-mono text-muted-foreground mr-2">{ticket.key}</span>
              {ticket.title}
            </h1>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-normal text-foreground border border-border hover:bg-accent rounded-pill transition-colors"
              >
                <RiPencilLine className="text-[14px]" />
                Edit
              </button>
              {confirmingDelete ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      await ticketsController.remove(ticket.id);
                      navigate('/tickets');
                    }}
                    className="px-3 py-1.5 text-xs font-normal text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-pill transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmingDelete(false)}
                    className="px-3 py-1.5 text-xs font-normal text-muted-foreground hover:text-foreground hover:bg-accent rounded-pill transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingDelete(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-normal text-destructive hover:bg-destructive/10 rounded-pill transition-colors"
                >
                  <RiDeleteBinLine className="text-[14px]" />
                  Delete
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={ticket.resolution}
              onChange={(e) => void ticketsController.update(ticket.id, { resolution: e.target.value as Resolution })}
              className="bg-secondary border border-border rounded-pill px-3 py-1.5 text-xs text-foreground outline-none focus:border-ring"
            >
              {RESOLUTION_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              value={ticket.status}
              onChange={(e) => void ticketsController.update(ticket.id, { status: e.target.value as Status })}
              className="bg-secondary border border-border rounded-pill px-3 py-1.5 text-xs text-foreground outline-none focus:border-ring"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description & attachments */}
        <div className="bg-card border border-border rounded-sm p-5">
          <h3 className="font-mono text-[10px] text-muted-foreground mb-2 uppercase tracking-[0.12em]">Description</h3>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {ticket.description || 'No description provided.'}
          </p>

          {ticket.attachments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <h3 className="font-mono text-[10px] text-muted-foreground mb-2 uppercase tracking-[0.12em]">Attachments</h3>
              <div className="flex flex-wrap gap-2">
                {ticket.attachments.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 bg-secondary border border-border rounded-sm px-3 py-2">
                    <RiAttachment2 className="text-muted-foreground text-[14px] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-foreground truncate">{a.name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatSize(a.sizeKb)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="bg-card border border-border rounded-sm p-5">
          <h3 className="font-mono text-[10px] text-muted-foreground mb-3 uppercase tracking-[0.12em]">Details</h3>
          <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
            <DetailRow label="Priority">
              <span className={PRIORITY_META[ticket.priority]}>{ticket.priority}</span>
            </DetailRow>
            <DetailRow label="Responsible team">{ticket.responsibleTeam || '—'}</DetailRow>
            <DetailRow label="Component/s">{ticket.components.join(', ') || '—'}</DetailRow>
            <DetailRow label="Associated group">{ticket.associatedGroup || '—'}</DetailRow>
            <DetailRow label="Labels">{ticket.labels.join(', ') || 'None'}</DetailRow>
            <DetailRow label="Ticket requester">{ticket.ticketRequester || '—'}</DetailRow>
            <DetailRow label="Severity">
              <span className={PRIORITY_META[ticket.severity]}>{ticket.severity}</span>
            </DetailRow>
            <DetailRow label="Detected in release">{ticket.detectedInRelease || '—'}</DetailRow>
            <DetailRow label="Fix version">{ticket.fixVersion || '—'}</DetailRow>
          </div>
        </div>

        {/* Sub-tasks */}
        <div className="bg-card border border-border rounded-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.12em]">Sub-tasks</h3>
            <button
              onClick={() => setShowAddSubtask((v) => !v)}
              className="flex items-center gap-1 text-xs font-normal text-muted-foreground hover:text-foreground transition-colors"
            >
              <RiAddLine className="text-[14px]" />
              Add sub-task
            </button>
          </div>

          {showAddSubtask && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submitSubtask();
              }}
              className="flex flex-col gap-2 mb-3 p-3 bg-secondary rounded-sm"
            >
              <input
                value={subtaskTitle}
                onChange={(e) => setSubtaskTitle(e.target.value)}
                placeholder="Title"
                className={inputClass}
                autoFocus
              />
              <input
                value={subtaskJiraLink}
                onChange={(e) => setSubtaskJiraLink(e.target.value)}
                placeholder="Jira link (optional) — e.g. https://yourco.atlassian.net/browse/TPL-127"
                className={inputClass}
              />
              <textarea
                value={subtaskDescription}
                onChange={(e) => setSubtaskDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className={`${inputClass} resize-none`}
              />
              <button
                type="submit"
                disabled={addingSubtask || !subtaskTitle.trim()}
                className="self-end px-3 py-1.5 text-xs font-normal text-primary-foreground bg-primary hover:bg-primary-active disabled:opacity-50 rounded-pill transition-colors"
              >
                {addingSubtask ? 'Adding…' : 'Add sub-task'}
              </button>
            </form>
          )}

          {ticket.subtasks.length === 0 ? (
            <p className="text-xs text-muted-foreground">No sub-tasks yet.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {ticket.subtasks.map((s) => (
                <li key={s.id} className="flex flex-col gap-1 px-2 py-1.5 rounded-sm hover:bg-accent">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={s.done}
                      onChange={(e) => void toggleTicketSubtask(ticket.id, s.id, e.target.checked)}
                      className="shrink-0 accent-primary w-3.5 h-3.5"
                    />
                    <span
                      className={`flex-1 min-w-0 text-sm truncate ${s.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                    >
                      {s.title}
                    </span>
                    {s.jiraLink && (
                      <a
                        href={s.jiraLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-foreground shrink-0"
                        aria-label="Open in Jira"
                      >
                        <RiExternalLinkLine className="text-[13px]" />
                      </a>
                    )}
                  </div>
                  {s.description && (
                    <p className="pl-6 text-xs text-muted-foreground whitespace-pre-wrap">{s.description}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Right column */}
      <div className="w-[300px] shrink-0 flex flex-col gap-5">
        <div className="bg-card border border-border rounded-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.12em]">People</h3>
            <span className="text-[11px] text-muted-foreground">
              Votes: {ticket.votes} · Watching: {ticket.watchers}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <PersonRow label="Assignee" name={ticket.assignee} />
            {ticket.secondAssignee && <PersonRow label="2nd assignee" name={ticket.secondAssignee} />}
            <PersonRow label="Reporter" name={ticket.reporter} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-sm p-5 flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-4 mb-3 border-b border-border">
            {(['comments', 'worklog', 'history', 'activity'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pb-2 text-xs font-normal capitalize transition-colors ${
                  tab === t ? 'text-foreground border-b border-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'worklog' ? 'Work log' : t}
              </button>
            ))}
          </div>

          {tab === 'comments' ? (
            <div className="flex flex-col gap-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void submitComment();
                }}
                className="flex flex-col gap-2"
              >
                <textarea
                  value={draftComment}
                  onChange={(e) => setDraftComment(e.target.value)}
                  rows={2}
                  placeholder="Add comment…"
                  className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-ring placeholder:text-muted-foreground resize-none"
                />
                <button
                  type="submit"
                  disabled={postingComment || !draftComment.trim()}
                  className="self-end px-3 py-1.5 text-xs font-normal text-primary-foreground bg-primary hover:bg-primary-active disabled:opacity-50 rounded-pill transition-colors"
                >
                  {postingComment ? 'Posting…' : 'Comment'}
                </button>
              </form>

              <ul className="flex flex-col gap-3">
                {[...ticket.comments].reverse().map((c) => (
                  <li key={c.id} className="flex gap-2.5">
                    <Avatar name={c.author} size={24} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-normal text-foreground">{c.author}</span>
                        <span className="text-[10px] text-muted-foreground">{formatDateTime(c.createdAt)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{c.body}</p>
                    </div>
                  </li>
                ))}
                {ticket.comments.length === 0 && <p className="text-xs text-muted-foreground">No comments yet.</p>}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No {tab === 'worklog' ? 'work log entries' : tab} yet.</p>
          )}
        </div>
      </div>

      {isEditOpen && (
        <Modal title="Edit ticket" onClose={() => setEditOpen(false)} widthClassName="max-w-xl">
          <TicketForm
            initial={ticket}
            submitLabel="Save changes"
            onSubmit={async (values) => {
              await ticketsController.update(ticket.id, values);
              setEditOpen(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground/80 mb-0.5">{label}</p>
      <p className="text-foreground">{children}</p>
    </div>
  );
}

function PersonRow({ label, name }: { label: string; name: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar name={name || '?'} size={28} />
      <div className="min-w-0">
        <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground/80">{label}</p>
        <p className="text-sm text-foreground truncate">{name || 'Unassigned'}</p>
      </div>
    </div>
  );
}
