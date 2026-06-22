// src/components/board/TicketForm.tsx
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Priority, Resolution, Status, Ticket } from '../../types/resources';

export interface TicketFormValues {
  key: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  severity: Priority;
  resolution: Resolution;
  components: string[];
  labels: string[];
  fixVersion: string;
  responsibleTeam: string;
  associatedGroup: string;
  ticketRequester: string;
  detectedInRelease: string;
  assignee: string;
  secondAssignee: string;
  reporter: string;
}

interface TicketFormProps {
  initial?: Partial<Ticket>;
  submitLabel: string;
  onSubmit: (values: TicketFormValues) => Promise<void> | void;
}

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS: Priority[] = ['Highest', 'High', 'Medium', 'Low', 'Lowest'];
const RESOLUTION_OPTIONS: Resolution[] = ['Unresolved', 'Resolved', "Won't Fix", 'Duplicate', 'Cannot Reproduce'];

function joinList(list?: string[]) {
  return (list ?? []).join(', ');
}

function splitList(value: string) {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

const inputClass =
  'w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-ring placeholder:text-muted-foreground';
const labelClass = 'block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-1.5';

export function TicketForm({ initial, submitLabel, onSubmit }: TicketFormProps) {
  const [key, setKey] = useState(initial?.key ?? '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [status, setStatus] = useState<Status>(initial?.status ?? 'todo');
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'Medium');
  const [severity, setSeverity] = useState<Priority>(initial?.severity ?? 'Medium');
  const [resolution, setResolution] = useState<Resolution>(initial?.resolution ?? 'Unresolved');
  const [components, setComponents] = useState(joinList(initial?.components));
  const [labels, setLabels] = useState(joinList(initial?.labels));
  const [fixVersion, setFixVersion] = useState(initial?.fixVersion ?? '');
  const [responsibleTeam, setResponsibleTeam] = useState(initial?.responsibleTeam ?? '');
  const [associatedGroup, setAssociatedGroup] = useState(initial?.associatedGroup ?? '');
  const [ticketRequester, setTicketRequester] = useState(initial?.ticketRequester ?? '');
  const [detectedInRelease, setDetectedInRelease] = useState(initial?.detectedInRelease ?? '');
  const [assignee, setAssignee] = useState(initial?.assignee ?? '');
  const [secondAssignee, setSecondAssignee] = useState(initial?.secondAssignee ?? '');
  const [reporter, setReporter] = useState(initial?.reporter ?? '');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !key.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        key: key.trim(),
        title: title.trim(),
        description,
        status,
        priority,
        severity,
        resolution,
        components: splitList(components),
        labels: splitList(labels),
        fixVersion: fixVersion.trim(),
        responsibleTeam: responsibleTeam.trim(),
        associatedGroup: associatedGroup.trim(),
        ticketRequester: ticketRequester.trim(),
        detectedInRelease: detectedInRelease.trim(),
        assignee: assignee.trim(),
        secondAssignee: secondAssignee.trim(),
        reporter: reporter.trim(),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Key</label>
          <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="TPL-126" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className={inputClass}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className={inputClass} autoFocus />
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Description"
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={inputClass}>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Severity</label>
          <select value={severity} onChange={(e) => setSeverity(e.target.value as Priority)} className={inputClass}>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Components</label>
          <input value={components} onChange={(e) => setComponents(e.target.value)} placeholder="Backend, API" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Fix version</label>
          <input value={fixVersion} onChange={(e) => setFixVersion(e.target.value)} placeholder="24.10" className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Labels</label>
        <input value={labels} onChange={(e) => setLabels(e.target.value)} placeholder="urgent, backend" className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Resolution</label>
          <select value={resolution} onChange={(e) => setResolution(e.target.value as Resolution)} className={inputClass}>
            {RESOLUTION_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Detected in release</label>
          <input
            value={detectedInRelease}
            onChange={(e) => setDetectedInRelease(e.target.value)}
            placeholder="24.10"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Responsible team</label>
          <input
            value={responsibleTeam}
            onChange={(e) => setResponsibleTeam(e.target.value)}
            placeholder="Backend"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Associated group</label>
          <input
            value={associatedGroup}
            onChange={(e) => setAssociatedGroup(e.target.value)}
            placeholder="Cloud Computing"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Ticket requester</label>
        <input
          value={ticketRequester}
          onChange={(e) => setTicketRequester(e.target.value)}
          placeholder="Digital Design"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Assignee</label>
          <input value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Name" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>2nd assignee</label>
          <input
            value={secondAssignee}
            onChange={(e) => setSecondAssignee(e.target.value)}
            placeholder="Name"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Reporter</label>
          <input value={reporter} onChange={(e) => setReporter(e.target.value)} placeholder="Name" className={inputClass} />
        </div>
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
