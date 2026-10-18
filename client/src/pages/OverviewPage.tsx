import {
  FiArrowRight,
  FiArrowUpRight,
  FiCalendar,
  FiCheckSquare,
  FiFlag,
  FiLayers,
  FiPlus,
} from "react-icons/fi";
import type { Workspace } from "../hooks/useWorkspace";
import { pretty, label } from "../utils/workspace";
import { PageWorkspace } from "../components/layout/PageWorkspace";
import { localDate } from "../utils/workspace";
import { ItemDescription } from "../components/items/ItemDescription";

export function OverviewPage({
  workspace,
}: {
  workspace: Pick<
    Workspace,
    | "open"
    | "count"
    | "deadlines"
    | "items"
    | "setPage"
    | "active"
    | "loading"
    | "row"
    | "upcoming"
  >;
}) {
  const {
    open,
    count,
    deadlines,
    items,
    setPage,
    active,
    loading,
    row,
    upcoming,
  } = workspace;
  const today = localDate(new Date());
  const dueToday = active.filter((item) => item.date === today);
  return (
    <PageWorkspace
      sidebarLabel="Overview sections"
      sidebar={
        <>
          <h2 className="border-b border-[#eeebf3] p-4 text-[length:calc(0.7857rem*var(--main-font-scale))] font-medium text-[#756b80]">
            Overview
          </h2>
          <nav aria-label="Overview sections" className="space-y-1 p-3">
            {[
              ["overview-summary", "Summary"],
              ["overview-tasks", "Open tasks"],
              ["overview-upcoming", "Upcoming"],
            ].map(([id, title]) => (
              <button
                key={id}
                className="block w-full rounded-md px-3 py-2 text-left text-[length:calc(0.7143rem*var(--main-font-scale))] text-[#8c8396] hover:bg-[#f0eaf8] hover:text-[#8066b3]"
                onClick={() =>
                  document
                    .getElementById(id)
                    ?.scrollIntoView({ block: "start" })
                }
              >
                {title}
              </button>
            ))}
          </nav>
          <section className="border-t border-[#eeebf3] p-4">
            <h3 className="text-[length:calc(0.7143rem*var(--main-font-scale))] font-medium text-[#8c8396]">
              Today <span className="ml-1 font-normal">{dueToday.length}</span>
            </h3>
            {dueToday.slice(0, 5).map((item) => (
              <button
                key={item.id}
                className="mt-3 block w-full text-left text-[length:calc(0.7143rem*var(--main-font-scale))] leading-relaxed text-[#8c8396] hover:text-[#8066b3]"
                onClick={() => open(item.kind, item)}
              >
                {item.title}
                <span className="mt-1 block text-[length:calc(0.5714rem*var(--main-font-scale))] text-[#aaa0b4]">
                  {label(item.kind)}
                </span>
              </button>
            ))}
            {dueToday.length === 0 && (
              <p className="mt-3 text-[length:calc(0.7143rem*var(--main-font-scale))] text-[#aaa0b4]">
                No open items due today.
              </p>
            )}
          </section>
        </>
      }
    >
      <div className="px-5 pt-5">
        <div
          id="overview-summary"
          className="stats grid grid-cols-[repeat(4,_1fr)] gap-[17px] mb-5 max-[1100px]:gap-2.5 max-[760px]:grid-cols-[repeat(2,_1fr)] max-[760px]:gap-3"
        >
          {(
            [
              {
                name: "Open tasks",
                value: count("task"),
                Icon: FiCheckSquare,
                go: "Tasks",
                caption: "Not completed",
                color: "violet bg-[#f0ebfb] text-[#a18acb]",
              },
              {
                name: "Upcoming deadlines",
                value: count("deadline"),
                Icon: FiFlag,
                go: "Deadlines",
                caption: deadlines[0]?.date
                  ? `Next up · ${pretty(deadlines[0].date)}`
                  : "No open deadlines",
                color: "orange bg-[#fdf0e6] text-[#d6a47d]",
              },
              {
                name: "In the backlog",
                value: count("backlog"),
                Icon: FiLayers,
                go: "Backlog",
                caption: "Not started",
                color: "blue bg-[#edf1fc] text-[#90a4d2]",
              },
              {
                name: "Completed",
                value: items.filter((x) => x.status === "done").length,
                Icon: FiCheckSquare,
                go: "Tasks",
                caption: "Finished items",
                color: "green bg-[#eaf6ef] text-[#91b69f]",
              },
            ] as const
          ).map((s) => (
            <button
              className="stat bg-white [border:1px_solid_#ebebf2] rounded-[10px] p-[19px_20px] text-left relative flex flex-col items-start hover:border-[#cfc2eb] [&_>_span:not(.stat-icon)]:text-[length:calc(0.7143rem*var(--main-font-scale))] [&_>_span:not(.stat-icon)]:text-[#97929f] [&_strong]:text-[length:calc(1.9286rem*var(--main-font-scale))] [&_strong]:font-medium [&_strong]:leading-[1] [&_strong]:[margin:9px_0_13px] [&_small]:text-[length:calc(0.6429rem*var(--main-font-scale))] [&_small]:text-[#aba6b4] min-[1500px]:p-[23px] max-[1100px]:p-[15px] max-[760px]:[&_strong]:text-[length:calc(1.7857rem*var(--main-font-scale))]"
              key={s.name}
              onClick={() => setPage(s.go)}
            >
              <span
                className={
                  "stat-icon w-[31px] h-[31px] grid place-items-center rounded-lg mb-[17px] " +
                  s.color
                }
              >
                <s.Icon />
              </span>
              <FiArrowUpRight className="stat-arrow absolute right-[18px] top-[20px] text-[#b7b5c2] text-[length:calc(0.9286rem*var(--main-font-scale))]" />
              <span>{s.name}</span>
              <strong>{s.value}</strong>
              <small>{s.caption}</small>
            </button>
          ))}
        </div>
        <div className="overview-grid grid grid-cols-[1.55fr_1fr] gap-5.5 min-[1500px]:[&_.empty]:p-[45px_20px] max-[1100px]:grid-cols-[1.25fr_1fr] max-[760px]:grid-cols-[1fr]">
          <section
            id="overview-tasks"
            className="panel [border:1px_solid_#eaeaf1] bg-white rounded-[11px] overflow-hidden"
          >
            <div className="panel-title flex justify-between items-center p-[22px_22px_0] [&_h2]:text-[length:calc(0.9286rem*var(--main-font-scale))] [&_h2]:font-semibold [&_h2]:flex [&_h2]:gap-[9px] [&_h2]:items-center [&_h2_span]:text-[length:calc(0.6429rem*var(--main-font-scale))] [&_h2_span]:bg-[#f1edf8] [&_h2_span]:text-[#9c84c2] [&_h2_span]:rounded [&_h2_span]:p-[3px_6px] [&_button]:text-[length:calc(0.6429rem*var(--main-font-scale))] [&_button]:text-[#9a8aad] [&_button]:flex [&_button]:items-center [&_button]:gap-[7px] [&_>_svg]:text-[#b1a4c4]">
              <h2>
                Open tasks{" "}
                <span>{active.filter((x) => x.kind === "task").length}</span>
              </h2>
              <button onClick={() => setPage("Tasks")}>
                All tasks <FiArrowUpRight />
              </button>
            </div>
            {loading ? (
              <div className="empty p-[32px_20px] text-center text-[#aaa3b3] [&_>_svg]:[margin:0_auto_14px] [&_>_svg]:text-[length:calc(1.7857rem*var(--main-font-scale))] [&_>_svg]:text-[#c2b4d7] [&_h3]:text-[length:calc(0.9286rem*var(--main-font-scale))] [&_h3]:font-medium [&_h3]:text-[#82778d] [&_p]:text-[length:calc(0.7857rem*var(--main-font-scale))] [&_p]:[margin:9px_0_17px] [&_p]:leading-[1.7] [&.compact]:p-[32px_15px] [&.large]:p-[75px_20px]">
                Loading your workspace…
              </div>
            ) : (
              active
                .filter((x) => x.kind === "task")
                .slice(0, 4)
                .map(row)
            )}
            {!active.some((x) => x.kind === "task") && (
              <div className="empty p-[32px_20px] text-center text-[#aaa3b3] [&_>_svg]:[margin:0_auto_14px] [&_>_svg]:text-[length:calc(1.7857rem*var(--main-font-scale))] [&_>_svg]:text-[#c2b4d7] [&_h3]:text-[length:calc(0.9286rem*var(--main-font-scale))] [&_h3]:font-medium [&_h3]:text-[#82778d] [&_p]:text-[length:calc(0.7857rem*var(--main-font-scale))] [&_p]:[margin:9px_0_17px] [&_p]:leading-[1.7] [&.compact]:p-[32px_15px] [&.large]:p-[75px_20px]">
                <FiCheckSquare />
                <h3>No open tasks</h3>
                <p>Create a task to get started.</p>
                <button
                  className="text-btn text-[#8d71b9] text-[length:calc(0.7857rem*var(--main-font-scale))] inline-flex items-center gap-[9px]"
                  onClick={() => open("task")}
                >
                  Create a task <FiPlus />
                </button>
              </div>
            )}
            <button
              className="add-row [border-top:1px_solid_#f0edf5] w-full p-[16px_22px] text-[#aaa1b5] text-[length:calc(0.7143rem*var(--main-font-scale))] flex items-center gap-2.5 text-left hover:bg-[#faf8fe]"
              onClick={() => open("task")}
            >
              <FiPlus /> Add task
            </button>
          </section>
          <section
            id="overview-upcoming"
            className="panel upcoming [border:1px_solid_#eaeaf1] bg-white rounded-[11px] overflow-hidden flex flex-col [&_.calendar-link]:mt-auto"
          >
            <div className="panel-title flex justify-between items-center p-[22px_22px_0] [&_h2]:text-[length:calc(0.9286rem*var(--main-font-scale))] [&_h2]:font-semibold [&_h2]:flex [&_h2]:gap-[9px] [&_h2]:items-center [&_h2_span]:text-[length:calc(0.6429rem*var(--main-font-scale))] [&_h2_span]:bg-[#f1edf8] [&_h2_span]:text-[#9c84c2] [&_h2_span]:rounded [&_h2_span]:p-[3px_6px] [&_button]:text-[length:calc(0.6429rem*var(--main-font-scale))] [&_button]:text-[#9a8aad] [&_button]:flex [&_button]:items-center [&_button]:gap-[7px] [&_>_svg]:text-[#b1a4c4]">
              <h2>Upcoming</h2>
              <FiCalendar />
            </div>
            {upcoming.slice(0, 3).map((x) => (
              <button
                className="horizon-row flex text-left gap-[13px] p-[17px_22px] items-center [&_>_span:last-child]:min-w-0 [&_strong]:block [&_strong]:text-[length:calc(0.7857rem*var(--main-font-scale))] [&_strong]:font-medium [&_strong]:[overflow-wrap:anywhere] [&_>_span_>_small]:block [&_>_span_>_small]:text-[length:calc(0.6429rem*var(--main-font-scale))] [&_>_span_>_small]:text-[#afa4ba] [&_>_span_>_small]:mt-[5px]"
                key={x.id}
                onClick={() => open(x.kind, x)}
              >
                <span className="date-tile bg-[#f6f2fa] [border:1px_solid_#eae3f1] min-w-[42px] rounded-[7px] text-center p-[7px] [&_small]:block [&_small]:text-[length:calc(0.5714rem*var(--main-font-scale))] [&_small]:uppercase [&_small]:text-[#a28cb7] [&_b]:text-[length:calc(1.2143rem*var(--main-font-scale))] [&_b]:font-medium [&_b]:text-[#8f75a9]">
                  <small>
                    {new Date(x.date! + "T12:00:00").toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                      },
                    )}
                  </small>
                  <b>{Number(x.date!.slice(-2))}</b>
                </span>
                <span>
                  <strong>{x.title}</strong>
                  <ItemDescription description={x.description} />
                  <small>
                    {label(x.kind)}
                    {x.person && ` · ${x.person}`}
                  </small>
                </span>
              </button>
            ))}
            {upcoming.length === 0 && (
              <div className="empty compact p-[32px_20px] text-center text-[#aaa3b3] [&_>_svg]:[margin:0_auto_14px] [&_>_svg]:text-[length:calc(1.7857rem*var(--main-font-scale))] [&_>_svg]:text-[#c2b4d7] [&_h3]:text-[length:calc(0.9286rem*var(--main-font-scale))] [&_h3]:font-medium [&_h3]:text-[#82778d] [&_p]:text-[length:calc(0.7857rem*var(--main-font-scale))] [&_p]:[margin:9px_0_17px] [&_p]:leading-[1.7] [&.compact]:p-[32px_15px] [&.large]:p-[75px_20px]">
                <FiCalendar />
                <h3>No upcoming items</h3>
                <p>Dated tasks, deadlines, and events appear here.</p>
              </div>
            )}
            <button
              className="calendar-link [border-top:1px_solid_#f0edf5] w-full flex justify-between p-[17px_22px] text-[#9c85b8] text-[length:calc(0.7143rem*var(--main-font-scale))]"
              onClick={() => setPage("Calendar")}
            >
              Open calendar <FiArrowRight />
            </button>
          </section>
        </div>
      </div>
    </PageWorkspace>
  );
}
