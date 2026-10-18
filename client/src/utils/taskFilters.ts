import type { Item } from "../types/workspace";

export type TaskPeriod = "day" | "week" | "month" | "year" | "all";
export function taskRange(date: Date, period: TaskPeriod) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  let end = new Date(start);
  if (period === "week") {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    end = new Date(start);
    end.setDate(end.getDate() + 7);
  } else if (period === "month") {
    start.setDate(1);
    end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  } else if (period === "year") {
    start.setMonth(0, 1);
    end = new Date(start.getFullYear() + 1, 0, 1);
  } else end.setDate(end.getDate() + 1);
  return { start, end };
}
export function filterTasks(
  items: Item[],
  period: TaskPeriod,
  date: Date,
  query: string,
  status: "all" | "open" | "done",
  priority: "all" | Item["priority"] = "all",
  kind: "task" | "deadline" | "backlog" = "task",
) {
  const { start, end } = taskRange(date, period),
    search = query.trim().toLowerCase();
  return items
    .filter(
      (item) =>
        item.kind === kind &&
        (status === "all" || item.status === status) &&
        (priority === "all" || (item.priority || "medium") === priority) &&
        (!search ||
          item.title.toLowerCase().includes(search) ||
          (kind !== "task" &&
            `${item.description} ${item.person}`
              .toLowerCase()
              .includes(search)) ||
          (kind !== "deadline" &&
            item.subtasks.some((step) =>
              (step.description || step.title || "")
                .toLowerCase()
                .includes(search),
            ))) &&
        (period === "all" ||
          (kind === "deadline"
            ? !!item.date &&
              new Date(item.date + "T00:00:00") >= start &&
              new Date(item.date + "T00:00:00") < end
            : !!item.created_at &&
              new Date(item.created_at) >= start &&
              new Date(item.created_at) < end)),
    )
    .sort(
      (a, b) =>
        Number(a.status === "done") - Number(b.status === "done") ||
        (kind === "deadline"
          ? (a.date || "9999").localeCompare(b.date || "9999")
          : (b.created_at || "").localeCompare(a.created_at || "")),
    );
}
