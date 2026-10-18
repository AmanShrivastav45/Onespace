import { Temporal } from "temporal-polyfill";
import type { Event } from "@dayflow/core";
import type { StoredCalendarEvent } from "../types/dayflow";

export function restoreEvent(event: StoredCalendarEvent): Event {
  const parse = (value: string) =>
    event.allDay
      ? Temporal.PlainDate.from(value)
      : value.includes("[")
        ? Temporal.ZonedDateTime.from(value)
        : Temporal.PlainDateTime.from(value);
  return { ...event, start: parse(event.start), end: parse(event.end) };
}

export function storeEvent(event: Event): StoredCalendarEvent {
  // Keep native data, not rendering objects or private drag/layout fields.
  const {
    id,
    title,
    description,
    start,
    end,
    allDay,
    calendarId,
    calendarIds,
    conference,
    meta,
  } = event;
  return {
    id,
    title,
    description: description || "",
    start: start.toString(),
    end: end.toString(),
    allDay: !!allDay,
    calendarId,
    calendarIds,
    conference,
    meta,
  };
}

export function calendarEventChanges(
  current: Event[],
  incoming: StoredCalendarEvent[],
) {
  const existing = new Map(current.map((event) => [event.id, event]));
  const restored = incoming.map(restoreEvent);
  const ids = new Set(restored.map((event) => event.id));
  return {
    add: restored.filter((event) => !existing.has(event.id)),
    update: restored
      .filter(
        (event) =>
          existing.has(event.id) &&
          JSON.stringify(storeEvent(existing.get(event.id)!)) !==
            JSON.stringify(storeEvent(event)),
      )
      .map((event) => ({ id: event.id, updates: event })),
    delete: current
      .filter((event) => !ids.has(event.id))
      .map((event) => event.id),
  };
}
