import type { Item } from "../types/workspace";

export type ItemDateFilter = "all" | "today" | "week" | "overdue" | "undated";
export function filterItems(
  items: Item[],
  status: Item["status"] | "all",
  priority: Item["priority"] | "all",
  period: ItemDateFilter,
  today: string,
) {
  const end = new Date(`${today}T12:00:00`);
  end.setDate(end.getDate() + 6);
  const weekEnd = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
  return items.filter(
    (item) =>
      (status === "all" || item.status === status) &&
      (priority === "all" || item.priority === priority) &&
      (period === "all" ||
        (period === "today" && item.date === today) ||
        (period === "week" &&
          !!item.date &&
          item.date >= today &&
          item.date <= weekEnd) ||
        (period === "overdue" &&
          !!item.date &&
          item.date < today &&
          item.status === "open") ||
        (period === "undated" && !item.date)),
  );
}
