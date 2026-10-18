import { useState } from "react";
import axios from "axios";
import { FiX } from "react-icons/fi";
import type { Workspace } from "../../hooks/useWorkspace";
import { api } from "../../api/client";

export function TaskComposer({
  workspace,
}: {
  workspace: Pick<Workspace, "draft" | "setDraft" | "config" | "load">;
}) {
  const { draft, setDraft, config, load } = workspace;
  const [note, setNote] = useState(draft?.id ? draft.title : "");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [priority, setPriority] = useState(draft?.priority || "medium");
  async function remove() {
    if (!draft?.id) return;
    setBusy(true);
    setError("");
    try {
      await api.delete(`/items/${draft.id}`);
      await load();
      setDraft(null);
    } catch {
      setError("Could not delete this task. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function submit() {
    setBusy(true);
    setError("");
    try {
      if (draft?.id)
        await api.patch(`/tasks/${draft.id}/title`, {
          note,
          ...(priority !== draft.priority ? { priority } : {}),
        });
      else await api.post("/tasks", { note });
      await load();
      setDraft(null);
    } catch (e) {
      setError(
        axios.isAxiosError(e) && typeof e.response?.data.detail === "string"
          ? e.response.data.detail
          : "Could not save the task. Your note is preserved; try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="[--main-font-scale:1.25] fixed inset-0 z-50 flex items-center justify-center bg-[#2e21374d] p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) setDraft(null);
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-composer-title"
        className="w-full max-w-[560px] rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[#eeebf3] px-5 py-4">
          <h2
            id="task-composer-title"
            className="text-[length:calc(1rem*var(--main-font-scale))] font-medium"
          >
            {draft?.id ? "Edit task" : "Create task"}
          </h2>
          <button
            disabled={busy}
            aria-label="Close task form"
            onClick={() => setDraft(null)}
          >
            <FiX />
          </button>
        </div>
        <form
          className="p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label
            htmlFor="task-note"
            className="text-[length:calc(0.7143rem*var(--main-font-scale))] text-[#8c8396]"
          >
            What needs to be done?
          </label>
          <textarea
            id="task-note"
            autoFocus
            required
            minLength={3}
            maxLength={10000}
            disabled={busy}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write the task in your own words…"
            className="mt-2 min-h-[130px] w-full resize-y rounded-lg border border-[#e4ddeb] p-3 text-[length:calc(0.7857rem*var(--main-font-scale))] leading-relaxed outline-none focus:border-[#ac91cb]"
          />
          {draft?.id && (
            <label className="mt-3 flex items-center gap-3 text-[length:calc(0.7143rem*var(--main-font-scale))] text-[#8c8396]">
              Priority
              <select
                aria-label="Task priority"
                value={priority}
                disabled={busy}
                onChange={(event) =>
                  setPriority(event.target.value as typeof priority)
                }
                className="rounded-md border border-[#e4ddeb] bg-white px-3 py-1.5 outline-none focus:border-[#ac91cb]"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
          )}
          <p className="mt-2 text-[length:calc(0.6429rem*var(--main-font-scale))] leading-relaxed text-[#9b93a5]">
            {config.ai_configured
              ? "Your note will be polished into a single-line task. Creation time is recorded automatically; tasks have no deadline."
              : "AI is not configured. Notes up to 200 characters can be saved as one line without polishing. Tasks have no deadline."}
          </p>
          {error && (
            <p
              role="alert"
              className="mt-3 text-[length:calc(0.7143rem*var(--main-font-scale))] text-amber-800"
            >
              {error}
            </p>
          )}
          {confirmDelete && (
            <div className="mt-4 rounded-md bg-[#faf2f3] p-3 text-[length:calc(0.7143rem*var(--main-font-scale))] text-[#a5707d]">
              Delete this task and its subtasks?
              <button
                type="button"
                disabled={busy}
                className="ml-3 underline"
                onClick={() => void remove()}
              >
                Confirm delete
              </button>
            </div>
          )}
          <div className="mt-5 flex justify-end gap-2">
            {draft?.id && (
              <button
                type="button"
                disabled={busy}
                className="mr-auto text-[length:calc(0.7143rem*var(--main-font-scale))] text-[#a5707d]"
                onClick={() => setConfirmDelete((value) => !value)}
              >
                Delete task
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              className="rounded-md border border-[#e5dfec] px-3 py-2 text-[length:calc(0.7143rem*var(--main-font-scale))]"
              onClick={() => setDraft(null)}
            >
              Cancel
            </button>
            <button
              disabled={busy || note.trim().length < 3}
              className="rounded-md bg-[#8066c6] px-3 py-2 text-[length:calc(0.7143rem*var(--main-font-scale))] text-white disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save task"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
