import { useEffect, useState } from "react";
import axios from "axios";
import { api } from "../api/client";
import type { Item, Kind, Page } from "../types/workspace";
import { today, blank } from "../utils/workspace";
import { ItemRow } from "../components/items/ItemRow";
import { TaskRow } from "../components/items/TaskRow";
import { DeadlineRow } from "../components/items/DeadlineRow";

export function useWorkspace() {
  const [page, setPage] = useState<Page>("Overview"),
    [items, setItems] = useState<Item[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [search, setSearch] = useState("");
  const [navigationSearch, setNavigationSearch] = useState("");
  const [calendarFocus, setCalendarFocus] = useState<string | null>(null);
  const [draft, setDraft] = useState<Item | null>(null),
    [note, setNote] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [config, setConfig] = useState({
      ai_configured: false,
      email_configured: false,
    });
  const [sub, setSub] = useState("");
  async function load() {
    try {
      const [a, b] = await Promise.all([api.get("/items"), api.get("/health")]);
      setItems(a.data);
      setConfig(b.data);
      setError("");
    } catch {
      setError("Could not connect to the server. Start FastAPI and try again.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  const active = items.filter((x) => x.status === "open"),
    deadlines = active
      .filter((x) => x.kind === "deadline")
      .sort((a, b) => (a.date || "").localeCompare(b.date || "")),
    tasks = items.filter((x) => x.kind === "task");
  const upcoming = active
    .filter((x) => x.date && x.date >= today)
    .sort((a, b) => a.date!.localeCompare(b.date!));
  const filtered = items.filter(
    (x) =>
      x.title.toLowerCase().includes(search.toLowerCase()) ||
      x.description.toLowerCase().includes(search.toLowerCase()),
  );
  function open(kind: Kind, item?: Item) {
    if (kind === "event") {
      setCalendarFocus(item?.id ?? null);
      setPage("Calendar");
      return;
    }
    setDraft(item ? structuredClone(item) : blank(kind));
    setNote("");
    setNotice("");
    setSub("");
  }
  async function save() {
    if (!draft) return;
    setBusy(true);
    setNotice("");
    try {
      if (draft.id) await api.put("/items/" + draft.id, draft);
      else await api.post("/items", draft);
      await load();
      setDraft(null);
    } catch (e) {
      setNotice(
        axios.isAxiosError(e) && typeof e.response?.data.detail === "string"
          ? e.response.data.detail
          : "Could not save. Check the required fields and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function polish() {
    if (!draft) return;
    setBusy(true);
    setNotice("");
    try {
      const { data } = await api.post("/polish", { note, kind: draft.kind });
      setDraft({ ...draft, ...data, id: draft.id, kind: draft.kind });
      setNotice(
        data.source === "manual"
          ? "AI is not configured yet. Your note has been copied into the fields below for you to edit."
          : "Draft polished. Review the details before saving.",
      );
    } catch {
      setNotice(
        "Polishing is unavailable. You can enter the details below; your note is preserved.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function toggle(item: Item) {
    try {
      await api.put("/items/" + item.id, {
        ...item,
        status: item.status === "done" ? "open" : "done",
      });
      await load();
    } catch {
      setError("Could not update this item. Please try again.");
    }
  }
  async function remove() {
    if (!draft) return;
    setBusy(true);
    try {
      await api.delete("/items/" + draft.id);
      await load();
      setDraft(null);
    } catch {
      setNotice("Could not delete this item. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const row = (item: Item) =>
    item.kind === "deadline" ? (
      <DeadlineRow key={item.id} item={item} open={open} refresh={load} />
    ) : item.kind === "task" || item.kind === "backlog" ? (
      <TaskRow key={item.id} item={item} open={open} refresh={load} />
    ) : (
      <ItemRow key={item.id} item={item} toggle={toggle} open={open} />
    );
  const count = (k: Kind) => active.filter((x) => x.kind === k).length;
  return {
    page,
    setPage,
    items,
    loading,
    error,
    search,
    setSearch,
    draft,
    setDraft,
    note,
    setNote,
    busy,
    notice,
    config,
    sub,
    setSub,
    navigationSearch,
    calendarFocus,
    setNavigationSearch,
    active,
    deadlines,
    upcoming,
    filtered,
    open,
    save,
    polish,
    toggle,
    remove,
    load,
    row,
    count,
  };
}

export type Workspace = ReturnType<typeof useWorkspace>;
