import { FiX, FiBell, FiTrash2, FiCheck } from "react-icons/fi";
import type { Workspace } from "../../hooks/useWorkspace";
import type { Item } from "../../types/workspace";
import { label } from "../../utils/workspace";
import { TaskComposer } from "./TaskComposer";
import { NoteComposer } from "./NoteComposer";

export function ItemEditor({
  workspace,
}: {
  workspace: Pick<
    Workspace,
    | "draft"
    | "busy"
    | "setDraft"
    | "note"
    | "setNote"
    | "polish"
    | "config"
    | "notice"
    | "remove"
    | "save"
    | "load"
  >;
}) {
  const {
    draft,
    busy,
    setDraft,
    note,
    setNote,
    polish,
    config,
    notice,
    remove,
    save,
  } = workspace;
  if (!draft) return null;
  if ((draft.kind === "deadline" || draft.kind === "backlog") && !draft.id)
    return (
      <NoteComposer key={draft.kind} kind={draft.kind} workspace={workspace} />
    );
  if (draft.kind === "task")
    return <TaskComposer key={draft.id || "new-task"} workspace={workspace} />;
  return (
    <div
      className="modal-backdrop fixed inset-0 bg-[#2e21374d] [backdrop-filter:blur(4px)] flex items-center justify-center p-5 z-[50] max-[760px]:p-2.5"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) setDraft(null);
      }}
    >
      <section
        className="modal bg-white rounded-2xl w-[590px] max-h-[92vh] flex flex-col shadow-[0_20px_80px_#39254c30]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header p-[23px_27px] [border-bottom:1px_solid_#eee8f3] flex justify-between items-center [&_h2]:text-[length:calc(1.5714rem*var(--main-font-scale))] [&_h2]:font-medium max-[760px]:p-5">
          <div>
            <h2 id="modal-title">
              {draft.id ? "Edit" : "Create"} {label(draft.kind).toLowerCase()}
            </h2>
          </div>
          <button
            className="icon-btn inline-flex items-center justify-center p-[7px] text-[#a79bb6] rounded-[5px] hover:bg-[#f4f0f9]"
            aria-label="Close dialog"
            disabled={busy}
            onClick={() => setDraft(null)}
          >
            <FiX />
          </button>
        </div>
        <div className="modal-body overflow-auto p-[23px_27px] [&_label]:block [&_label]:text-[length:calc(0.7857rem*var(--main-font-scale))] [&_label]:text-[#8e7e9b] [&_label]:mb-[17px] [&_input:not([type='checkbox'])]:block [&_input:not([type='checkbox'])]:w-full [&_input:not([type='checkbox'])]:[border:1px_solid_#e3dbe9] [&_input:not([type='checkbox'])]:rounded-[7px] [&_input:not([type='checkbox'])]:bg-white [&_input:not([type='checkbox'])]:p-[10px_12px] [&_input:not([type='checkbox'])]:mt-[7px] [&_input:not([type='checkbox'])]:text-[#65566f] [&_input:not([type='checkbox'])]:outline-none [&_input:not([type='checkbox'])]:text-[length:calc(0.8571rem*var(--main-font-scale))] [&_textarea]:block [&_textarea]:w-full [&_textarea]:[border:1px_solid_#e3dbe9] [&_textarea]:rounded-[7px] [&_textarea]:bg-white [&_textarea]:p-[10px_12px] [&_textarea]:mt-[7px] [&_textarea]:text-[#65566f] [&_textarea]:outline-none [&_textarea]:text-[length:calc(0.8571rem*var(--main-font-scale))] [&_select]:block [&_select]:w-full [&_select]:[border:1px_solid_#e3dbe9] [&_select]:rounded-[7px] [&_select]:bg-white [&_select]:p-[10px_12px] [&_select]:mt-[7px] [&_select]:text-[#65566f] [&_select]:outline-none [&_select]:text-[length:calc(0.8571rem*var(--main-font-scale))] [&_input:focus]:border-[#a58ac5] [&_textarea:focus]:border-[#a58ac5] [&_textarea]:min-h-[80px] [&_textarea]:resize-y [&_input::placeholder]:text-[#baafc2] [&_textarea::placeholder]:text-[#baafc2] max-[760px]:p-5">
          {!draft.id && (
            <div className="capture bg-[#f8f4fc] [border:1px_solid_#e9e0f3] rounded-[10px] p-[17px] mb-[23px] [&&_label]:[margin:0] [&&_textarea]:mb-2.5 [&&_textarea]:min-h-[90px] [&&_small]:block [&&_small]:text-[length:calc(0.6429rem*var(--main-font-scale))] [&&_small]:leading-[1.7] [&&_small]:text-[#ac9bbb] [&&_small]:mt-2.5">
              <label htmlFor="rough">Rough notes</label>
              <textarea
                id="rough"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Follow up with the reviewer on October 21 about the static analysis fixes. Remind me 3 days before."
              />
              <button
                className="polish text-[length:calc(0.7857rem*var(--main-font-scale))] text-[#9a75bc] bg-[#efe5f8] p-[9px_12px] rounded-[5px]"
                disabled={busy || note.trim().length < 3}
                onClick={() => void polish()}
              >
                ✧ {busy ? "Working…" : "Generate draft"}
              </button>
              <small>
                {config.ai_configured
                  ? "AI connected · Review all details before saving"
                  : "Connect an API key for AI polishing, or fill in the details below."}
              </small>
            </div>
          )}
          {notice && (
            <p
              className="notice bg-[#faf2e4] text-[#aa8c61] p-3 rounded-[7px] text-[length:calc(0.7857rem*var(--main-font-scale))] leading-[1.7] mb-4"
              role="status"
            >
              {notice}
            </p>
          )}
          <label>
            Title
            <input
              autoFocus
              value={draft.title}
              maxLength={200}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Enter a title"
            />
          </label>
          <label>
            Description
            <textarea
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
              placeholder="Add a description…"
            />
          </label>
          <div
            className={`form-grid grid ${draft.kind === "backlog" ? "grid-cols-1" : "grid-cols-[1fr_1fr]"} gap-4`}
          >
            {draft.kind !== "backlog" && (
              <label>
                Date *
                <input
                  type="date"
                  value={draft.date || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, date: e.target.value || null })
                  }
                />
              </label>
            )}
            <label>
              Priority
              <select
                value={draft.priority}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    priority: e.target.value as Item["priority"],
                  })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>
          {draft.kind !== "backlog" && (
            <label>
              Person / contact
              <input
                value={draft.person}
                onChange={(e) => setDraft({ ...draft, person: e.target.value })}
                placeholder="Who’s involved? (optional)"
              />
            </label>
          )}
          {draft.kind === "deadline" && (
            <div className="reminder [border:1px_solid_#eee5f4] p-3.5 rounded-lg mb-5 text-[#ac8fbe] [&&_>_svg]:[float:left] [&&_>_svg]:[margin:6px_9px_0_0] [&&_label]:flex [&&_label]:gap-2 [&&_label]:items-center [&&_label]:[margin:0] [&&_input:not([type='checkbox'])]:w-[65px] [&&_input:not([type='checkbox'])]:[margin:0] [&&_input:not([type='checkbox'])]:p-1.5 [&&_small]:block [&&_small]:text-[length:calc(0.6429rem*var(--main-font-scale))] [&&_small]:leading-[1.6] [&&_small]:mt-2.5 [&&_small]:text-[#af9fba]">
              <FiBell />
              <label>
                Remind me{" "}
                <input
                  type="number"
                  min={0}
                  max={365}
                  value={draft.reminder_days}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      reminder_days: Number(e.target.value),
                    })
                  }
                />{" "}
                days before
              </label>
              <small>
                {config.email_configured
                  ? "Email reminders connected"
                  : "Set SMTP credentials and your email in server/.env to enable delivery."}
              </small>
            </div>
          )}
        </div>
        <div className="modal-footer flex justify-end gap-2.5 p-[18px_27px] [border-top:1px_solid_#eee8f3] max-[760px]:p-3.5 max-[760px]:[&_.primary]:text-[length:calc(0.7143rem*var(--main-font-scale))]">
          {draft.id && (
            <button
              className="delete mr-auto flex items-center gap-[7px] text-[length:calc(0.7857rem*var(--main-font-scale))] text-[#c58e9a]"
              disabled={busy}
              onClick={() => void remove()}
            >
              <FiTrash2 /> Delete
            </button>
          )}
          <button
            className="secondary [border:1px_solid_#e5dfec] rounded-md p-[9px_13px] text-[length:calc(0.7857rem*var(--main-font-scale))] inline-flex items-center gap-1.5 bg-white"
            disabled={busy}
            onClick={() => setDraft(null)}
          >
            Cancel
          </button>
          <button
            className="primary bg-[#8066c6] text-white inline-flex items-center justify-center gap-2 rounded-[7px] p-[12px_17px] text-[length:calc(0.7857rem*var(--main-font-scale))] font-semibold shadow-[0_3px_5px_#7156b617] hover:bg-[#6d54b1]"
            disabled={
              busy ||
              !draft.title.trim() ||
              (["deadline", "event"].includes(draft.kind) && !draft.date)
            }
            onClick={() => void save()}
          >
            <FiCheck />{" "}
            {busy ? "Saving…" : "Save " + label(draft.kind).toLowerCase()}
          </button>
        </div>
      </section>
    </div>
  );
}
