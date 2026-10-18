import type { CalendarType, Event } from "@dayflow/core";

export type StoredCalendarEvent = Omit<Event, "start" | "end" | "icon"> & {
  start: string;
  end: string;
};
export type CalendarData = {
  timeZone: string;
  events: StoredCalendarEvent[];
  calendars: CalendarType[];
  groups: string[];
};
