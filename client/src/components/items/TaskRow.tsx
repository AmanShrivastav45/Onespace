import { useState } from "react";
import { FiChevronRight, FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import type { Item, Kind } from "../../types/workspace";
import { api } from "../../api/client";

export function TaskRow({
  item,
  refresh,
  open,
}: {
  item: Item;
  refresh: () => Promise<void>;
  open: (kind: Kind, item?: Item) => void;
}) {
  const [expanded, setExpanded] = useState(false),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [editing, setEditing] = useState<string | null>(null),
    [editTitle, setEditTitle] = useState("");
  async function change(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
      await refresh();
    } catch {
      setError(`Could not update this ${item.kind}. Please try again.`);
    } finally {
      setBusy(false);
    }
  }
  const date = item.created_at ? new Date(item.created_at) : null;
  const backlog = item.kind === "backlog";
  const priority = item.priority || "medium";
  const priorityColor = {
    high: "border-red-200 bg-red-50 text-red-700",
    medium: "border-amber-200 bg-amber-50 text-amber-700",
    low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  }[priority];
  return (
    <div className="border-b border-[#efedf3]">
      <div className="flex min-h-[48px] items-center gap-4 px-4 py-1.5 text-[length:calc(0.7143rem*var(--main-font-scale))]">
        <button
          className="shrink-0 rounded p-1 text-[#9b93a5] hover:bg-[#f5f1fa]"
          aria-expanded={expanded}
          aria-controls={`subtasks-${item.id}`}
          aria-label={`${expanded ? "Collapse" : "Expand"} subtasks for ${item.title}`}
          onClick={() => setExpanded((value) => !value)}
        >
          <FiChevronRight
            className={`transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </button>
        <input
          type="checkbox"
          aria-label={`Complete ${item.title}`}
          checked={item.status === "done"}
          disabled={busy}
          className="size-3.5 shrink-0 accent-green-600"
          onChange={() =>
            void change(() =>
              api.put(`/items/${item.id}`, {
                ...item,
                status: item.status === "done" ? "open" : "done",
                subtasks: item.subtasks.map((step) => ({
                  ...step,
                  done: item.status !== "done",
                })),
              }),
            )
          }
        />
        <button
          title={item.title}
          aria-expanded={expanded}
          aria-controls={`subtasks-${item.id}`}
          className={`min-w-0 flex-1 text-left ${item.status === "done" ? "text-[#aaa0b4]" : "text-[#62596c]"}`}
          onClick={() => setExpanded((value) => !value)}
        >
          <span
            className={`block truncate ${item.status === "done" ? "line-through" : ""}`}
          >
            {item.title}
          </span>
          {backlog && item.description && (
            <span className="mt-0.5 block whitespace-pre-wrap text-[length:calc(0.6429rem*var(--main-font-scale))] leading-relaxed text-[#9b93a5] [overflow-wrap:anywhere]">
              {item.description}
            </span>
          )}
        </button>
        <div className="flex shrink-0 items-center gap-4 sm:gap-6">
          <span
            aria-label={
              item.subtasks.length ? "Completed subtasks" : "No subtasks"
            }
            className="min-w-8 text-center text-[length:calc(0.5714rem*var(--main-font-scale))] text-[#aaa0b4]"
          >
            {item.subtasks.length
              ? `${item.subtasks.filter((step) => step.done).length}/${item.subtasks.length}`
              : "–"}
          </span>
          <div
            aria-label={`${priority} priority`}
            className={`w-[68px] shrink-0 rounded-sm border px-2 py-0.5 text-center text-[12px] ${priorityColor}`}
          >
            {priority[0].toUpperCase() + priority.slice(1)}
          </div>
          <time
            dateTime={item.created_at}
            title={
              date ? `Created: ${date.toLocaleString()}` : "Date unavailable"
            }
            className="hidden w-[150px] shrink-0 text-[length:calc(0.6429rem*var(--main-font-scale))] text-[#aaa0b4] min-[1100px]:block"
          >
            {date
              ? date.toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </time>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              title="Add subtask"
              aria-label={`Add subtask to ${item.title}`}
              onClick={() => setExpanded(true)}
              className="shrink-0 rounded p-1.5 text-[#a18bb7] hover:bg-[#f5f1fa]"
            >
              <FiPlus />
            </button>
            <button
              aria-label={`Edit ${item.title}`}
              onClick={() => open(item.kind, item)}
              className="shrink-0 rounded p-1.5 text-[#aaa0b4] hover:bg-[#f5f1fa]"
            >
              <FiEdit2 />
            </button>
            <button
              title={`Delete ${item.kind}`}
              aria-label={`Delete ${item.title}`}
              disabled={busy}
              onClick={() => void change(() => api.delete(`/items/${item.id}`))}
              className="shrink-0 rounded p-1.5 text-[#aaa0b4] hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            >
              <FiTrash2 />
            </button>
          </div>
        </div>
      </div>
      {expanded && (
        <div
          id={`subtasks-${item.id}`}
          className="border-t border-[#f3f0f7] bg-[#fdfcfe] py-2 pr-4 pl-[68px]"
        >
          <ul>
            {item.subtasks.map((step) => (
              <li
                key={step.id}
                className="flex min-h-[36px] items-center gap-3 py-0.5 text-[length:calc(0.7143rem*var(--main-font-scale))]"
              >
                <input
                  type="checkbox"
                  aria-label={`Complete subtask ${step.description || step.title || ""}`}
                  checked={step.done}
                  disabled={busy}
                  className="size-3.5 shrink-0 accent-green-600"
                  onChange={() =>
                    void change(() =>
                      api.put(`/items/${item.id}`, {
                        ...item,
                        subtasks: item.subtasks.map((value) =>
                          value.id === step.id
                            ? { ...value, done: !value.done }
                            : value,
                        ),
                      }),
                    )
                  }
                />
                {editing === step.id ? (
                  <form
                    className="flex min-w-0 flex-1 items-center gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const title = backlog
                        ? editTitle.trim()
                        : editTitle.trim().replace(/\s+/g, " ");
                      if (!title) return;
                      void change(async () => {
                        await api.patch(
                          `/items/${item.id}/subtasks/${step.id}/${backlog ? "description" : "title"}`,
                          {
                            note: title,
                          },
                        );
                        setEditing(null);
                      });
                    }}
                  >
                    <input
                      autoFocus
                      aria-label={`Edit subtask ${step.description || step.title || ""}`}
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      disabled={busy}
                      required
                      minLength={3}
                      maxLength={backlog ? 10000 : 500}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") setEditing(null);
                      }}
                      className="min-w-0 flex-1 rounded border border-[#e9e3f0] bg-white px-2 py-0.5 outline-none focus:border-[#ac91cb]"
                    />
                    <button
                      disabled={busy || editTitle.trim().length < 3}
                      className="text-[#8066b3] disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setEditing(null)}
                      className="text-[#9b93a5]"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <span
                    title={step.description || step.title || ""}
                    className={`min-w-0 flex-1 ${backlog ? "whitespace-pre-wrap [overflow-wrap:anywhere]" : "truncate"} ${step.done ? "text-[#aaa0b4] line-through" : "text-[#8c8396]"}`}
                  >
                    {step.description || step.title || ""}
                  </span>
                )}
                <div className="flex shrink-0 items-center gap-4 sm:gap-6">
                  <time
                    dateTime={step.created_at || undefined}
                    title={
                      step.created_at
                        ? new Date(step.created_at).toLocaleString()
                        : "Creation time unavailable"
                    }
                    className="hidden w-[150px] shrink-0 text-[length:calc(0.6429rem*var(--main-font-scale))] text-[#aaa0b4] min-[1100px]:block"
                  >
                    {step.created_at
                      ? new Date(step.created_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </time>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span
                      aria-hidden="true"
                      className="invisible shrink-0 p-1.5"
                    >
                      <FiPlus />
                    </span>
                    <button
                      disabled={busy}
                      aria-label={`Edit subtask ${step.description || step.title || ""}`}
                      title="Edit subtask"
                      onClick={() => {
                        setEditing(step.id);
                        setEditTitle(step.description || step.title || "");
                      }}
                      className="shrink-0 rounded p-1.5 text-[#aaa0b4] hover:bg-[#f5f1fa] disabled:opacity-50"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      disabled={busy}
                      aria-label={`Remove subtask ${step.description || step.title || ""}`}
                      className="shrink-0 rounded p-1.5 text-[#b2a8bb] hover:bg-red-50 hover:text-red-600"
                      onClick={() =>
                        void change(() =>
                          api.put(`/items/${item.id}`, {
                            ...item,
                            subtasks: item.subtasks.filter(
                              (value) => value.id !== step.id,
                            ),
                          }),
                        )
                      }
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <form
            className="mt-1 flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (input.trim().length < 3) return;
              void change(async () => {
                await api.post(`/items/${item.id}/subtasks`, { note: input });
                setInput("");
              });
            }}
          >
            <input
              aria-label={`New subtask for ${item.title}`}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={busy}
              minLength={3}
              maxLength={backlog ? 10000 : 500}
              placeholder="Add a subtask…"
              className="min-w-0 flex-1 rounded-md border border-[#e9e3f0] bg-white px-3 py-1 text-[length:calc(0.7143rem*var(--main-font-scale))] outline-none focus:border-[#ac91cb]"
            />
            <button
              disabled={busy || input.trim().length < 3}
              className="rounded-md border border-[#e5dfec] px-3 py-1 text-[length:calc(0.6429rem*var(--main-font-scale))] text-[#8066b3] disabled:opacity-50"
            >
              Add
            </button>
          </form>
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="px-5 pb-3 text-[length:calc(0.7143rem*var(--main-font-scale))] text-amber-800"
        >
          {error}
        </p>
      )}
    </div>
  );
}
