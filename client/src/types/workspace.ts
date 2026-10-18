import type { StoredCalendarEvent } from "./dayflow";

export type Kind = "deadline" | "task" | "backlog" | "event";
export type Item = {
  id: string;
  created_at?: string;
  kind: Kind;
  title: string;
  description: string;
  date: string | null;
  person: string;
  priority: "low" | "medium" | "high";
  status: "open" | "done";
  reminder_days: number;
  subtasks: {
    id: string;
    title?: string;
    description?: string;
    done: boolean;
    created_at?: string | null;
  }[];
  dayflow?: StoredCalendarEvent | null;
};

export type Page =
  "Overview" | "Calendar" | "Deadlines" | "Tasks" | "Backlog" | "Skills";
