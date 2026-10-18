import { useState } from "react";
import { FiSearch, FiLayers } from "react-icons/fi";
import type { Workspace } from "../hooks/useWorkspace";
import type { Item } from "../types/workspace";
import { PageWorkspace } from "../components/layout/PageWorkspace";
import { PaneHeader } from "../components/layout/PaneHeader";
import { filterItems, type ItemDateFilter } from "../utils/itemFilters";
import { localDate } from "../utils/workspace";

const field =
  "mt-2 w-full rounded-md border border-[#e5e1eb] bg-white px-2.5 py-2 text-[length:calc(0.7143rem*var(--main-font-scale))] text-[#77717f] outline-none focus:border-[#ac91cb]";
export function ItemsPage({
  workspace,
}: {
  workspace: Pick<
    Workspace,
    "page" | "items" | "filtered" | "search" | "setSearch" | "loading" | "row"
  >;
}) {
  const { page, items, filtered, search, setSearch, loading, row } = workspace;
  const [status, setStatus] = useState<Item["status"] | "all">("all");
  const [priority, setPriority] = useState<Item["priority"] | "all">("all");
  const [period, setPeriod] = useState<ItemDateFilter>("all");
  const kind =
    page === "Deadlines" ? "deadline" : page === "Tasks" ? "task" : "backlog";
  const all = items.filter((item) => item.kind === kind);
  const visible = filterItems(
    filtered.filter((item) => item.kind === kind),
    status,
    priority,
    period,
    localDate(new Date()),
  );
  const reset = () => {
    setStatus("all");
    setPriority("all");
    setPeriod("all");
    setSearch("");
  };
  const narrowed =
    !!search || status !== "all" || priority !== "all" || period !== "all";
  return (
    <PageWorkspace
      sidebarLabel={`${page} filters`}
      sidebar={
        <>
          <PaneHeader>
            <h2 className="text-[length:calc(0.7857rem*var(--main-font-scale))] font-medium text-[#756b80]">
              {page}
            </h2>
            <button
              className="text-[length:calc(0.6429rem*var(--main-font-scale))] text-[#8066b3] hover:underline"
              onClick={reset}
            >
              Reset
            </button>
          </PaneHeader>
          <div className="space-y-5 p-4">
            <label className="block text-[length:calc(0.7143rem*var(--main-font-scale))] text-[#8c8396]">
              Search
              <span className="relative block">
                <FiSearch className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-[#aaa0b4]" />
                <input
                  className={`${field} pl-8`}
                  aria-label={`Search ${page.toLowerCase()}`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Title or description"
                />
              </span>
            </label>
            <fieldset>
              <legend className="mb-2 text-[length:calc(0.7143rem*var(--main-font-scale))] text-[#8c8396]">
                Status
              </legend>
              <div className="space-y-1">
                {(["all", "open", "done"] as const).map((value) => (
                  <button
                    key={value}
                    aria-pressed={status === value}
                    className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-[length:calc(0.7143rem*var(--main-font-scale))] ${status === value ? "bg-[#f0eaf8] font-medium text-[#8066b3]" : "text-[#8c8396] hover:bg-[#f5f2fa]"}`}
                    onClick={() => setStatus(value)}
                  >
                    <span>
                      {value === "all"
                        ? "All items"
                        : value === "open"
                          ? "Open"
                          : "Completed"}
                    </span>
                    <span className="text-[length:calc(0.6429rem*var(--main-font-scale))] opacity-70">
                      {
                        all.filter(
                          (item) => value === "all" || item.status === value,
                        ).length
                      }
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="block text-[length:calc(0.7143rem*var(--main-font-scale))] text-[#8c8396]">
              Priority
              <select
                className={field}
                value={priority}
                onChange={(e) => setPriority(e.target.value as typeof priority)}
              >
                <option value="all">All priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
            <label className="block text-[length:calc(0.7143rem*var(--main-font-scale))] text-[#8c8396]">
              Date
              <select
                className={field}
                value={period}
                onChange={(e) => setPeriod(e.target.value as ItemDateFilter)}
              >
                <option value="all">All dates</option>
                <option value="today">Today</option>
                <option value="week">Next 7 days</option>
                <option value="overdue">Overdue (open)</option>
                <option value="undated">No date</option>
              </select>
            </label>
          </div>
        </>
      }
    >
      <PaneHeader>
        <h2 className="text-[length:calc(0.8571rem*var(--main-font-scale))] font-medium text-[#756b80]">
          {status === "done" ? "Completed" : status === "open" ? "Open" : "All"}{" "}
          {page.toLowerCase()}
        </h2>
        <span
          aria-live="polite"
          className="text-[length:calc(0.6429rem*var(--main-font-scale))] text-[#aaa0b4]"
        >
          {visible.length} of {all.length} items
        </span>
      </PaneHeader>
      {loading ? (
        <p className="p-8 text-[length:calc(0.7857rem*var(--main-font-scale))] text-[#9b93a5]">
          Loading…
        </p>
      ) : (
        visible.map(row)
      )}
      {!loading && visible.length === 0 && (
        <div className="px-5 py-16 text-center text-[#9b93a5]">
          <FiLayers className="mx-auto mb-3 size-6 text-[#c2b4d7]" />
          <h3 className="text-[length:calc(0.8571rem*var(--main-font-scale))]">
            {narrowed ? "No matching items" : "No items yet"}
          </h3>
          <p className="mt-2 text-[length:calc(0.7143rem*var(--main-font-scale))]">
            {narrowed
              ? "Try changing your filters."
              : "Use the Create button to add an item."}
          </p>
          {narrowed && (
            <button
              className="mt-4 text-[length:calc(0.7143rem*var(--main-font-scale))] text-[#8066b3] hover:underline"
              onClick={reset}
            >
              Reset filters
            </button>
          )}
        </div>
      )}
    </PageWorkspace>
  );
}
