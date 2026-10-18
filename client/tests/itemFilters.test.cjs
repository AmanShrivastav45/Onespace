const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const filename = path.resolve(__dirname, "../src/utils/itemFilters.ts");
const helper = new Module(filename, module);
helper._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const { filterItems } = helper.exports;
const items = [
  { id: "old-open", date: "2026-12-29", status: "open", priority: "high" },
  { id: "old-done", date: "2026-12-29", status: "done", priority: "high" },
  { id: "today", date: "2026-12-30", status: "open", priority: "low" },
  { id: "next-year", date: "2027-01-05", status: "open", priority: "high" },
  { id: "outside-week", date: "2027-01-06", status: "open", priority: "high" },
  { id: "undated", date: null, status: "open", priority: "low" },
];

test("overdue excludes completed and undated work", () => {
  assert.deepEqual(filterItems(items, "all", "all", "overdue", "2026-12-30").map(item => item.id), ["old-open"]);
});

test("next seven days includes today and crosses the year boundary", () => {
  assert.deepEqual(filterItems(items, "open", "all", "week", "2026-12-30").map(item => item.id), ["today", "next-year"]);
});

test("priority and date filters combine and clearing all restores records", () => {
  assert.deepEqual(filterItems(items, "open", "low", "undated", "2026-12-30").map(item => item.id), ["undated"]);
  assert.equal(filterItems(items, "all", "all", "all", "2026-12-30").length, items.length);
});
