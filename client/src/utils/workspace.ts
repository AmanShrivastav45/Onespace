import type { Item, Kind } from "../types/workspace";

export const localDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const today = localDate(new Date());
export const label = (k: Kind) =>
  ({
    deadline: "Deadline",
    task: "Task",
    backlog: "Backlog item",
    event: "Event",
  })[k];
export const pretty = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
export const blank = (kind: Kind): Item => ({
  id: "",
  kind,
  title: "",
  description: "",
  date: null,
  person: "",
  priority: "medium",
  status: "open",
  reminder_days: 3,
  subtasks: [],
});
