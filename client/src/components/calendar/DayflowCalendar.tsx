import { useEffect, useMemo, useRef, useState } from "react";
import {
  DayFlowCalendar,
  useCalendarApp,
  createDayView,
  createWeekView,
  createMonthView,
  createYearView,
  createAgendaView,
  createEventsPlugin,
  temporalToDate,
  type ICalendarApp,
} from "@dayflow/react";
import { createDragPlugin } from "@dayflow/plugin-drag";
import { createSidebarPlugin } from "@dayflow/plugin-sidebar";
import { createKeyboardShortcutsPlugin } from "@dayflow/plugin-keyboard-shortcuts";
import type { CalendarData } from "../../types/dayflow";
import { api } from "../../api/client";
import {
  restoreEvent,
  storeEvent,
  calendarEventChanges,
} from "../../utils/dayflow";
import { dayflowTheme } from "../../utils/dayflowTheme";

export function DayflowCalendar({
  data,
  refresh,
  focusId,
}: {
  data: CalendarData;
  refresh: () => Promise<void>;
  focusId: string | null;
}) {
  const [failure, setFailure] = useState("");
  const [pending, setPending] = useState(0);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const appRef = useRef<ICalendarApp | null>(null);
  const groups = useRef(data.groups);
  const callbacks = useRef({ refresh });
  callbacks.current = { refresh };

  function enqueue(action: () => Promise<unknown>) {
    setPending((value) => value + 1);
    const task = queue.current.then(async () => {
      try {
        await action();
        await callbacks.current.refresh();
        setFailure("");
      } catch {
        setFailure(
          "Could not save calendar changes. The last saved version has been restored. Check the server and try again.",
        );
        const response = await api.get<CalendarData>("/calendar");
        const app = appRef.current!;
        const restored = response.data.events.map(restoreEvent);
        app.applyEventsChanges(
          {
            delete: app.getAllEvents().map((event) => event.id),
            add: restored,
          },
          false,
          "remote",
        );
        app.updateConfig({ calendars: response.data.calendars });
        groups.current = response.data.groups;
      } finally {
        setPending((value) => value - 1);
      }
    });
    queue.current = task.catch(() => {
      setFailure(
        "The calendar server is unavailable. Reconnect and reload the page before making more changes.",
      );
    });
    return queue.current;
  }
  function persistSettings() {
    const settings = {
      calendars: appRef.current!.getCalendars(),
      groups: [...groups.current],
    };
    return enqueue(() => api.put("/calendar/settings", settings));
  }
  const actions = useRef({ enqueue, persistSettings });
  actions.current = { enqueue, persistSettings };
  const plugins = useMemo(
    () => [
      createEventsPlugin(),
      createDragPlugin(),
      createSidebarPlugin({
        width: 240,
        initialCollapsed: false,
        groups: data.groups,
        onReorder: () => actions.current.persistSettings(),
        onGroupCreate: (name) => {
          groups.current = [...groups.current, name];
          return actions.current.persistSettings();
        },
        onGroupRename: (before, after) => {
          groups.current = groups.current.map((name) =>
            name === before ? after : name,
          );
          return actions.current.persistSettings();
        },
        onGroupDelete: (name) => {
          groups.current = groups.current.filter((value) => value !== name);
          return actions.current.persistSettings();
        },
        onGroupReorder: (names) => {
          groups.current = names;
          return actions.current.persistSettings();
        },
      }),
      createKeyboardShortcutsPlugin({
        callbacks: {
          undo: (app) => {
            const before = app.getAllEvents();
            app.undo();
            const after = app.getAllEvents(),
              ids = new Set(after.map((event) => event.id));
            return actions.current.enqueue(() =>
              api.post("/calendar/changes", {
                upsert: after.map(storeEvent),
                delete: before
                  .filter((event) => !ids.has(event.id))
                  .map((event) => event.id),
              }),
            );
          },
        },
      }),
    ],
    [],
  );
  const views = useMemo(
    () => [
      createDayView({ showAllDay: true }),
      createWeekView({ showAllDay: true }),
      createMonthView(),
      createYearView(),
      createAgendaView(),
    ],
    [],
  );
  const initialEvents = useMemo(() => data.events.map(restoreEvent), []);
  const calendar = useCalendarApp({
    views,
    plugins,
    events: initialEvents,
    calendars: data.calendars,
    defaultCalendar: data.calendars[0]?.id,
    defaultView: "week",
    timeZone: data.timeZone,
    useCalendarHeader: true,
    useEventDetailDialog: true,
    eventDetailTrigger: "click",
    theme: dayflowTheme,
    readOnly: pending > 0,
    callbacks: {
      onCalendarCreate: () => actions.current.persistSettings(),
      onCalendarUpdate: () => actions.current.persistSettings(),
      onCalendarDelete: () => actions.current.persistSettings(),
      onCalendarReorder: () => actions.current.persistSettings(),
    },
  });
  appRef.current = calendar.app;

  useEffect(() => {
    let active = true;
    // Wait for local saves; remote hydration must never write back to the store.
    void queue.current.then(() => {
      if (!active) return;
      const changes = calendarEventChanges(
        calendar.app.getAllEvents(),
        data.events,
      );
      if (
        changes.add.length ||
        changes.update.length ||
        changes.delete.length
      ) {
        calendar.app.applyEventsChanges(changes, false, "remote");
      }
    });
    return () => {
      active = false;
    };
  }, [calendar.app, data.events]);

  useEffect(() => {
    const app = calendar.app;
    const unsubscribe = app.subscribeEventChanges((changes) => {
      const local = changes.filter((change) => change.source !== "remote");
      if (!local.length) return;
      const payload = {
        upsert: local.flatMap((change) =>
          change.type === "delete"
            ? []
            : [
                storeEvent(
                  change.type === "update" ? change.after : change.event,
                ),
              ],
        ),
        delete: local.flatMap((change) =>
          change.type === "delete" ? [change.event.id] : [],
        ),
      };
      void actions.current.enqueue(() =>
        api.post("/calendar/changes", payload),
      );
    });
    // Visibility switches are native DayFlow actions, but do not emit calendar-update callbacks.
    const setVisibility = app.setCalendarVisibility,
      setAll = app.setAllCalendarsVisibility;
    app.setCalendarVisibility = (id, visible) => {
      setVisibility(id, visible);
      void actions.current.persistSettings();
    };
    app.setAllCalendarsVisibility = (visible) => {
      setAll(visible);
      void actions.current.persistSettings();
    };
    return () => {
      unsubscribe();
      app.setCalendarVisibility = setVisibility;
      app.setAllCalendarsVisibility = setAll;
    };
  }, [calendar.app]);

  useEffect(() => {
    if (!focusId) return;
    const event = calendar.app
      .getAllEvents()
      .find((value) => value.id === focusId);
    if (event) {
      calendar.app.setCurrentDate(temporalToDate(event.start));
      calendar.app.highlightEvent(focusId);
      calendar.app.onEventDetailToggle(focusId);
    }
  }, [calendar.app, focusId]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {failure && (
        <div
          role="alert"
          className="shrink-0 border-b border-amber-200 bg-amber-50 p-3 text-[length:calc(0.7143rem*var(--main-font-scale))] text-amber-900"
        >
          {failure}
        </div>
      )}
      {pending > 0 && (
        <p
          role="status"
          className="pointer-events-none absolute right-4 top-2 z-20 rounded bg-white/95 px-2 py-1 text-[length:calc(0.6429rem*var(--main-font-scale))] text-[#8c8396]"
        >
          Saving calendar changes…
        </p>
      )}
      <div className="dayflow-host min-h-0 min-w-0 flex-1 overflow-hidden bg-white">
        <DayFlowCalendar calendar={calendar} />
      </div>
    </div>
  );
}
