import { useState } from "react";
import axios from "axios";
import { FiX } from "react-icons/fi";
import { api } from "../../api/client";
import type { Workspace } from "../../hooks/useWorkspace";

export function NoteComposer({
  workspace,
  kind,
}: {
  workspace: Pick<Workspace, "setDraft" | "load">;
  kind: "deadline" | "backlog";
}) {
  const noun = kind === "deadline" ? "deadline" : "backlog item";
  const { setDraft, load } = workspace;
  const [note, setNote] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit() {
    setBusy(true);
    setError("");
    try {
      await api.post(kind === "deadline" ? "/deadlines" : "/backlog", { note });
      await load();
      setDraft(null);
    } catch (e) {
      setError(
        axios.isAxiosError(e) && typeof e.response?.data.detail === "string"
          ? e.response.data.detail
          : `Could not save the ${noun}. Your note is preserved; try again.`,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2e21374d] p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) setDraft(null);
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-composer-title"
        className="w-full max-w-[560px] rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[#eeebf3] px-5 py-4">
          <h2
            id="note-composer-title"
            className="text-[length:calc(1rem*var(--main-font-scale))] font-medium"
          >
            Create {noun}
          </h2>
          <button
            aria-label={`Close ${noun} form`}
            disabled={busy}
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
            htmlFor="item-note"
            className="text-[length:calc(0.7143rem*var(--main-font-scale))] text-[#8c8396]"
          >
            {kind === "deadline"
              ? "What needs to be done, and by when?"
              : "What would you like to work on later?"}
          </label>
          <textarea
            id="item-note"
            autoFocus
            required
            minLength={3}
            maxLength={10000}
            value={note}
            disabled={busy}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              kind === "deadline"
                ? "High priority: follow up with the reviewer next Thursday about the static analysis fixes. Confirm unresolved issues and remind me 3 days before."
                : "Explore improving the release process. Document the current pain points and possible improvements. Low priority for now."
            }
            className="mt-2 min-h-[150px] w-full resize-y rounded-lg border border-[#e4ddeb] p-3 text-[length:calc(0.7857rem*var(--main-font-scale))] leading-relaxed outline-none focus:border-[#ac91cb]"
          />
          {error && (
            <p
              role="alert"
              className="mt-3 text-[length:calc(0.7143rem*var(--main-font-scale))] text-amber-800"
            >
              {error}
            </p>
          )}
          <div className="mt-5 flex justify-end gap-2 text-[length:calc(0.7143rem*var(--main-font-scale))]">
            <button
              type="button"
              disabled={busy}
              onClick={() => setDraft(null)}
              className="rounded-md border border-[#e5dfec] px-3 py-2"
            >
              Cancel
            </button>
            <button
              disabled={busy || note.trim().length < 3}
              className="rounded-md bg-[#8066c6] px-3 py-2 text-white disabled:opacity-50"
            >
              {busy ? "Saving…" : `Save ${noun}`}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
