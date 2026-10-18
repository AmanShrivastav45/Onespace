import { useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import type { Item, Kind } from "../../types/workspace";
import { api } from "../../api/client";
import { today } from "../../utils/workspace";

export function DeadlineRow({
  item,
  open,
  refresh,
}: {
  item: Item;
  open: (kind: Kind, item?: Item) => void;
  refresh: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const colors = {
    high: "border-red-200 bg-red-50 text-red-700",
    medium: "border-amber-200 bg-amber-50 text-amber-700",
    low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
  async function change(remove = false) {
    setBusy(true);
    setError("");
    try {
      if (remove) await api.delete(`/items/${item.id}`);
      else
        await api.put(`/items/${item.id}`, {
          ...item,
          status: item.status === "done" ? "open" : "done",
        });
      await refresh();
    } catch {
      setError("Could not update this deadline. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="border-b border-[#efedf3]">
      <div className="flex min-h-[48px] items-center gap-4 px-4 py-3 text-[length:calc(0.7143rem*var(--main-font-scale))]">
        <input
          type="checkbox"
          aria-label={`Complete ${item.title}`}
          checked={item.status === "done"}
          disabled={busy}
          onChange={() => void change()}
          className="size-3.5 shrink-0 accent-green-600"
        />
        <div className="min-w-0 flex-1">
          <p
            className={`[overflow-wrap:anywhere] ${item.status === "done" ? "text-[#aaa0b4] line-through" : "text-[#62596c]"}`}
          >
            {item.title}
          </p>
          {item.description && (
            <p className="mt-0.5 whitespace-pre-wrap text-[length:calc(0.6429rem*var(--main-font-scale))] leading-relaxed text-[#9b93a5] [overflow-wrap:anywhere]">
              {item.description}
            </p>
          )}
        </div>
        <div
          className={`w-[68px] shrink-0 rounded-sm border px-2 py-0.5 text-center text-[12px] ${colors[item.priority]}`}
          aria-label={`${item.priority} priority`}
        >
          {item.priority[0].toUpperCase() + item.priority.slice(1)}
        </div>
        <time
          dateTime={item.date || undefined}
          title={`Due ${item.date || "date unavailable"}`}
          className={`w-[150px] shrink-0 text-[length:calc(0.6429rem*var(--main-font-scale))] ${item.date && item.date < today && item.status === "open" ? "text-red-600" : "text-[#aaa0b4]"}`}
        >
          {item.date
            ? new Date(item.date + "T00:00:00").toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "—"}
        </time>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            aria-label={`Edit ${item.title}`}
            onClick={() => open("deadline", item)}
            className="rounded p-1.5 text-[#aaa0b4] hover:bg-[#f5f1fa]"
          >
            <FiEdit2 />
          </button>
          <button
            aria-label={`Delete ${item.title}`}
            disabled={busy}
            onClick={() => void change(true)}
            className="rounded p-1.5 text-[#aaa0b4] hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <FiTrash2 />
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="px-4 pb-2 text-sm text-amber-800">
          {error}
        </p>
      )}
    </div>
  );
}
