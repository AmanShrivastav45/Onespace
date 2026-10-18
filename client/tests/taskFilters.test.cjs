const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const filename = path.resolve(__dirname, "../src/utils/taskFilters.ts");
const helper = new Module(filename, module);
helper._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const { filterTasks, taskRange } = helper.exports;

test("backlog uses creation periods and searches parent and subtask descriptions", () => {
  const items = [
    { id: "one", created_at: "2026-10-18T10:00:00", description: "Improve release tooling", subtasks: [{ description: "Collect developer feedback" }], status: "open" },
    { id: "two", created_at: "2026-09-02T10:00:00", description: "Document architecture", subtasks: [], status: "done" },
  ].map(item => ({ ...item, kind: "backlog", title: "Future work", priority: "low", date: "2026-10-18" }));
  const filter = (period, query) => filterTasks(items, period, new Date(2026, 9, 18), query, "all", "low", "backlog").map(item => item.id);
  assert.deepEqual(filter("day", "feedback"), ["one"]);
  assert.deepEqual(filter("month", "tooling"), ["one"]);
  assert.deepEqual(filter("year", "architecture"), ["two"]);
});

test("deadline periods use due dates and search descriptions and contacts", () => {
  const items = [
    { id: "due-today", date: "2026-10-18", description: "static analysis fixes", person: "the reviewer", status: "open" },
    { id: "due-later", date: "2026-11-02", description: "Deployment", person: "QA", status: "open" },
    { id: "done", date: "2026-10-12", description: "Completed review", person: "", status: "done" },
  ].map(item => ({ ...item, kind: "deadline", title: "Follow up", priority: "high", created_at: "2026-10-01T12:00:00", subtasks: [{title: "Confirm sign-off"}] }));
  const filter = (period, query = "") => filterTasks(items, period, new Date(2026, 9, 18), query, "all", "high", "deadline").map(item => item.id);
  assert.deepEqual(filter("day"), ["due-today"]);
  assert.deepEqual(filter("month"), ["due-today", "done"]);
  assert.deepEqual(filter("year"), ["due-today", "due-later", "done"]);
  assert.deepEqual(filter("all", "static analysis"), ["due-today"]);
  assert.deepEqual(filter("all", "reviewer"), ["due-today"]);
  assert.equal(filter("all", "sign-off").length, 0);
});

test("priority combines with date, search and status; legacy tasks default to medium", () => {
  const tasks = [
    { id: "high", priority: "high", status: "open" },
    { id: "low", priority: "low", status: "done" },
    { id: "legacy", status: "open" },
  ].map(task => ({ ...task, kind: "task", title: "Review QA", subtasks: [], created_at: "2026-10-18T12:00:00" }));
  assert.deepEqual(filterTasks(tasks, "day", new Date(2026, 9, 18), "qa", "open", "high").map(task => task.id), ["high"]);
  assert.equal(filterTasks(tasks, "all", new Date(), "", "open", "low").length, 0);
  assert.deepEqual(filterTasks(tasks, "all", new Date(), "", "all", "medium").map(task => task.id), ["legacy"]);
});

test("completed tasks move below open tasks while each group stays newest first", () => {
  const tasks = [
    { id: "recent-done", status: "done", created_at: "2026-10-18T12:00:00" },
    { id: "older-open", status: "open", created_at: "2026-10-16T12:00:00" },
    { id: "older-done", status: "done", created_at: "2026-10-15T12:00:00" },
    { id: "recent-open", status: "open", created_at: "2026-10-17T12:00:00" },
  ].map(task => ({ ...task, kind: "task", title: task.id, subtasks: [] }));
  const ordered = () => filterTasks(tasks, "all", new Date(), "", "all").map(task => task.id);
  assert.deepEqual(ordered(), ["recent-open", "older-open", "recent-done", "older-done"]);
  tasks[3].status = "done";
  assert.deepEqual(ordered(), ["older-open", "recent-done", "recent-open", "older-done"]);
  assert.equal(tasks[0].id, "recent-done");
});

test("task periods use creation time, not a historical due date", () => {
  const tasks = [
    { id: "in-week", kind: "task", created_at: "2026-10-14T12:00:00", date: "2026-11-01", status: "open", title: "Review", subtasks: [] },
    { id: "out-week", kind: "task", created_at: "2026-10-19T12:00:00", date: "2026-10-14", status: "open", title: "Later", subtasks: [] },
    { id: "unknown", kind: "task", status: "open", title: "Legacy", subtasks: [] },
  ];
  assert.deepEqual(filterTasks(tasks, "week", new Date(2026, 9, 18), "", "all").map(task => task.id), ["in-week"]);
  assert.equal(filterTasks(tasks, "all", new Date(), "", "all").length, 3);
});

test("week is Monday-based and periods end exclusively", () => {
  const { start, end } = taskRange(new Date(2027, 0, 3), "week");
  assert.equal(start.getDay(), 1);
  assert.equal(start.getFullYear(), 2026);
  assert.equal(start.getMonth(), 11);
  assert.equal(start.getDate(), 28);
  assert.equal(end.getDate(), 4);
  const month = taskRange(new Date(2028, 1, 29), "month");
  assert.equal(month.start.getDate(), 1);
  assert.equal(month.end.getMonth(), 2);
});

test("search includes subtasks and combines with completion status", () => {
  const tasks = [{ id: "one", kind: "task", status: "done", title: "Prepare release", subtasks: [{ title: "QA signoff" }] }];
  assert.equal(filterTasks(tasks, "all", new Date(), "qa", "done").length, 1);
  assert.equal(filterTasks(tasks, "all", new Date(), "qa", "open").length, 0);
});
