import { useState } from "react";
import { FiSearch, FiPlus } from "react-icons/fi";
import { PageWorkspace } from "../components/layout/PageWorkspace";
import type { Workspace } from "../hooks/useWorkspace";
import { filterTasks, type TaskPeriod } from "../utils/taskFilters";

export function TasksPage({
  workspace,
  kind = "task",
}: {
  workspace: Pick<Workspace, "items" | "row" | "open" | "loading">;
  kind?: "task" | "deadline" | "backlog";
}) {
  const { items, row, open, loading } = workspace;
  const [period, setPeriod] = useState<TaskPeriod>("week"),
    [date] = useState(() => new Date()),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState<"all" | "open" | "done">("all"),
    [priority, setPriority] = useState<"all" | "high" | "medium" | "low">(
      "all",
    );
  const tasks = items.filter((item) => item.kind === kind),
    visible = filterTasks(items, period, date, search, status, priority, kind);
  const noun =
    kind === "deadline"
      ? "deadline"
      : kind === "backlog"
        ? "backlog item"
        : "task";
  return (
    <PageWorkspace
      sidebarLabel={`${noun} filters`}
      sidebar={
        <>
          <div className="space-y-1 p-3">
            {(["all", "open", "done"] as const).map((value) => (
              <button
                key={value}
                aria-pressed={status === value}
                className={`flex w-full justify-between rounded-sm px-3 py-2 text-[length:calc(0.7143rem*var(--main-font-scale))] ${status === value ? "bg-[#f0eaf8] text-[#8066b3]" : "text-[#8c8396] hover:bg-[#f5f2fa]"}`}
                onClick={() => setStatus(value)}
              >
                <span>
                  {value === "all"
                    ? kind === "backlog"
                      ? "All backlog"
                      : `All ${noun}s`
                    : value === "open"
                      ? "Open"
                      : "Completed"}
                </span>
                <span>
                  {
                    tasks.filter(
                      (task) => value === "all" || task.status === value,
                    ).length
                  }
                </span>
              </button>
            ))}
          </div>
          <section
            aria-label={`${noun} priority filters`}
            className="space-y-1 border-t border-[#eeebf3] p-3"
          >
            {(["all", "high", "medium", "low"] as const).map((value) => (
              <button
                key={value}
                aria-pressed={priority === value}
                onClick={() => setPriority(value)}
                className={`flex w-full justify-between rounded-sm px-3 py-2 text-[length:calc(0.7143rem*var(--main-font-scale))] ${priority === value ? "bg-[#f0eaf8] text-[#8066b3]" : "text-[#8c8396] hover:bg-[#f5f2fa]"}`}
              >
                <span>
                  {value === "all"
                    ? "All priorities"
                    : value[0].toUpperCase() + value.slice(1)}
                </span>
                <span>
                  {
                    filterTasks(
                      items,
                      period,
                      date,
                      search,
                      status,
                      value,
                      kind,
                    ).length
                  }
                </span>
              </button>
            ))}
          </section>
        </>
      }
    >
      <div className="sticky top-0 z-10 flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-[#eeebf3] bg-white px-4 py-2">
        <button
          className="rounded p-1 text-[#9b93a5] hover:bg-[#f5f2fa]"
          aria-label={`Create ${noun}`}
          onClick={() => open(kind)}
        >
          <FiPlus />
        </button>
        <div
          role="group"
          aria-label={
            kind === "deadline"
              ? "Deadline due period"
              : kind === "backlog"
                ? "Backlog creation period"
                : "Task creation period"
          }
          className="inline-flex rounded-md border border-[#e5e1eb] bg-[#faf9fc] p-0.5"
        >
          {(
            [
              ["day", "Day"],
              ["week", "Week"],
              ["month", "Month"],
              ["year", "Year"],
              ["all", "All"],
            ] as const
          ).map(([value, text]) => (
            <button
              key={value}
              aria-pressed={period === value}
              className={`rounded px-3 py-1 text-[length:calc(0.6429rem*var(--main-font-scale))] ${period === value ? "bg-white text-[#8066b3] shadow-sm" : "text-[#9b93a5]"}`}
              onClick={() => setPeriod(value)}
            >
              {text}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-md border border-[#e9e3f0] px-3 py-1.5 text-[#aaa0b4]">
          <FiSearch className="size-3.5" />
          <input
            aria-label={
              kind === "deadline"
                ? "Search deadlines, descriptions and contacts"
                : kind === "backlog"
                  ? "Search backlog descriptions and subtasks"
                  : "Search tasks and subtasks"
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-[150px] bg-transparent text-[length:calc(0.7143rem*var(--main-font-scale))] text-[#756b80] outline-none"
          />
        </label>
      </div>
      {loading ? (
        <p className="p-8 text-[#9b93a5]">Loading…</p>
      ) : (
        visible.map(row)
      )}
      {!loading && !visible.length && (
        <p className="p-10 text-center text-[length:calc(0.7857rem*var(--main-font-scale))] text-[#9b93a5]">
          No {noun}s match this period and your filters.
        </p>
      )}
    </PageWorkspace>
  );
}
