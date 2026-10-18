import { FiCalendar, FiPlus } from "react-icons/fi";
import { lazy, Suspense, useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { ItemEditor } from "./components/items/ItemEditor";
import { OverviewPage } from "./pages/OverviewPage";
import { ItemsPage } from "./pages/ItemsPage";
import { TasksPage } from "./pages/TasksPage";
import { SkillsPage } from "./pages/SkillsPage";
import { useWorkspace } from "./hooks/useWorkspace";
import type { Page } from "./types/workspace";

const CalendarPage = lazy(() =>
  import("./pages/CalendarPage").then((module) => ({
    default: module.CalendarPage,
  })),
);

const pageDescriptions: Record<Page, string> = {
  Overview: "An overview of your tasks, deadlines, and upcoming events.",
  Calendar: "View your deadlines and events by date.",
  Deadlines: "Keep your commitments in sight, and ahead of schedule.",
  Tasks: "Manage tasks and subtasks, organized by when they were created.",
  Backlog: "Keep track of work you plan to take up later.",
  Skills: "Save reusable instructions and run supported actions.",
};

export default function App() {
  const workspace = useWorkspace();
  const { page, open, error, load } = workspace;
  const [createSkill, setCreateSkill] = useState(false);
  return (
    <div className="shell flex min-h-screen">
      <Sidebar workspace={workspace} />
      <main className="ml-[260px] flex h-dvh min-h-0 w-[calc(100%-260px)] flex-col overflow-hidden max-[760px]:ml-[220px] max-[760px]:w-[calc(100%-220px)] max-[760px]:min-w-[340px]">
        <header className="h-[60px] shrink-0 [border-bottom:1px_solid_#ededf4] bg-white flex items-center justify-between p-[0_43px] text-[length:calc(0.7857rem*var(--main-font-scale))] max-[1100px]:p-[0_24px] max-[760px]:h-[52px] max-[760px]:p-[0_20px]">
          <div className="breadcrumb text-[#a09eab] flex gap-[6px] [&_b]:font-medium [&_b]:text-[#62616f]">
            Workspace /
            <span className="font-semibold text-[#62616f]">{page}</span>
          </div>
          <span className="header-date flex items-center gap-2 text-[#8b8998] max-[760px]:text-[length:calc(0.6429rem*var(--main-font-scale))]">
            <FiCalendar />
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </header>
        <div className="content flex min-h-0 w-full flex-1 flex-col">
          <div className="page-heading flex shrink-0 items-center justify-between gap-5 border-b border-[#eeebf3] bg-white px-6 py-3 max-[760px]:px-4">
            <div>
              <h1 className="m-0 text-[length:calc(1rem*var(--main-font-scale))] font-semibold leading-tight text-[#62596c]">
                {page}
              </h1>
              <p className="mt-0.5 text-[length:calc(0.7143rem*var(--main-font-scale))] leading-relaxed text-[#95919f]">
                {pageDescriptions[page]}
              </p>
            </div>
            {page !== "Calendar" && (
              <button
                className="primary bg-[#8066c6] text-white inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[7px] px-3 py-2 text-[length:calc(0.7857rem*var(--main-font-scale))] font-semibold shadow-[0_3px_5px_#7156b617] hover:bg-[#6d54b1] max-[760px]:text-[length:calc(0.6429rem*var(--main-font-scale))]"
                onClick={() =>
                  page === "Skills"
                    ? setCreateSkill(true)
                    : open(
                        page === "Deadlines"
                          ? "deadline"
                          : page === "Backlog"
                            ? "backlog"
                            : "task",
                      )
                }
              >
                <FiPlus /> Create{" "}
                {page === "Deadlines"
                  ? "deadline"
                  : page === "Skills"
                    ? "skill"
                    : page === "Backlog"
                      ? "backlog item"
                      : "task"}
              </button>
            )}
          </div>
          {error && (
            <div
              className="error bg-[#faf2e4] text-[#aa8c61] p-3 rounded-[7px] text-[length:calc(0.7857rem*var(--main-font-scale))] leading-[1.7] shrink-0 [&_button]:underline [&_button]:ml-2.5"
              role="alert"
            >
              {error}{" "}
              <button onClick={() => void load()}>Retry connection</button>
            </div>
          )}
          {page === "Overview" ? (
            <OverviewPage workspace={workspace} />
          ) : page === "Calendar" ? (
            <Suspense
              fallback={
                <p
                  role="status"
                  className="p-5 text-[length:calc(0.7857rem*var(--main-font-scale))] text-[#8c8396]"
                >
                  Loading calendar…
                </p>
              }
            >
              <CalendarPage workspace={workspace} />
            </Suspense>
          ) : page === "Tasks" || page === "Deadlines" || page === "Backlog" ? (
            <div className="flex min-h-0 flex-1 flex-col [--main-font-scale:1.25]">
              <TasksPage
                key={page}
                workspace={workspace}
                kind={
                  page === "Deadlines"
                    ? "deadline"
                    : page === "Backlog"
                      ? "backlog"
                      : "task"
                }
              />
            </div>
          ) : page === "Skills" ? (
            <SkillsPage
              createRequested={createSkill}
              onCreateHandled={() => setCreateSkill(false)}
            />
          ) : (
            <ItemsPage key={page} workspace={workspace} />
          )}
        </div>
      </main>
      <ItemEditor workspace={workspace} />
    </div>
  );
}
