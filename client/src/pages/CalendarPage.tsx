import { useEffect, useState } from "react";
import type { Workspace } from "../hooks/useWorkspace";
import type { CalendarData } from "../types/dayflow";
import { api } from "../api/client";
import { DayflowCalendar } from "../components/calendar/DayflowCalendar";

export function CalendarPage({
  workspace,
}: {
  workspace: Pick<Workspace, "load" | "calendarFocus" | "items">;
}) {
  const [data, setData] = useState<CalendarData | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setError(false);
    api
      .get<CalendarData>("/calendar")
      .then((response) => {
        if (active) setData(response.data);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [attempt, workspace.items]);
  if (error)
    return (
      <div
        role="alert"
        className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-[length:calc(0.7857rem*var(--main-font-scale))] text-amber-900"
      >
        Could not load the calendar. Check the backend is running.{" "}
        <button
          className="ml-2 underline"
          onClick={() => setAttempt((value) => value + 1)}
        >
          Retry
        </button>
      </div>
    );
  if (!data)
    return (
      <p
        role="status"
        className="p-5 text-[length:calc(0.7857rem*var(--main-font-scale))] text-[#8c8396]"
      >
        Loading calendar…
      </p>
    );
  return (
    <DayflowCalendar
      data={data}
      refresh={workspace.load}
      focusId={workspace.calendarFocus}
    />
  );
}
