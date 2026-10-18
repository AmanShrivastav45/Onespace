const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const filename = path.resolve(__dirname, "../src/utils/dayflow.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const helpers = new Module(filename, module);
helpers.filename = filename;
helpers.paths = module.paths;
helpers._compile(compiled, filename);
const { restoreEvent, storeEvent, calendarEventChanges } = helpers.exports;

test("a newly loaded deadline is added without changing an existing calendar event", async () => {
  const { CalendarApp, createWeekView } = await import("@dayflow/core");
  const meeting = { id: "meeting", title: "Release meeting", description: "Discuss readiness", start: "2026-10-21T10:00:00", end: "2026-10-21T11:00:00", allDay: false, calendarId: "events", meta: {location: "Office"} };
  const deadline = { id: "deadline", title: "QA sign-off", description: "Confirm results", start: "2026-10-22", end: "2026-10-23", allDay: true, calendarId: "deadlines" };
  const app = new CalendarApp({views: [createWeekView({showAllDay: true})], theme: {mode: "light"}, events: [restoreEvent(meeting)]});
  const changes = calendarEventChanges(app.getAllEvents(), [meeting, deadline]);
  assert.equal(changes.add.length, 1);
  assert.equal(changes.update.length, 0);
  assert.equal(changes.delete.length, 0);
  const emitted = [];
  const unsubscribe = app.subscribeEventChanges(batch => emitted.push(...batch));
  app.applyEventsChanges(changes, false, "remote");
  assert.deepEqual(JSON.parse(JSON.stringify(storeEvent(app.getAllEvents().find(event => event.id === "meeting")))), meeting);
  assert.equal(app.getAllEvents().length, 2);
  assert.ok(emitted.every(change => change.source === "remote"));
  assert.deepEqual(calendarEventChanges(app.getAllEvents(), [meeting, deadline]), {add: [], update: [], delete: []});
  unsubscribe();
});

for (const [label, times] of Object.entries({
  "all-day multi-day": { start: "2026-10-21", end: "2026-10-24", allDay: true },
  "local timed": { start: "2026-10-21T10:00:00", end: "2026-10-21T11:30:00", allDay: false },
  "timezone aware": { start: "2026-10-21T10:00:00+05:30[Asia/Kolkata]", end: "2026-10-21T11:00:00+05:30[Asia/Kolkata]", allDay: false },
})) {
  test(`${label} dates and native metadata survive a JSON round trip`, () => {
    const input = { id: "test", title: "Review", description: "Details", calendarId: "events", calendarIds: ["events", "work"], conference: { joinUrl: "https://meet.example.test/demo" }, meta: { location: "Office" }, ...times };
    const native = restoreEvent(input);
    const output = JSON.parse(JSON.stringify(storeEvent({ ...native, _originalStartHour: 10, day: 2 })));
    assert.deepEqual(output, input);
  });
}

test("native DayFlow mutations expose confirmed changes and distinguish remote hydration", async () => {
  const { CalendarApp, createWeekView } = await import("@dayflow/core");
  const app = new CalendarApp({ views: [createWeekView()], theme: { mode: "light" }, events: [] });
  const changes = [];
  const unsubscribe = app.subscribeEventChanges(batch => changes.push(...batch));
  const event = restoreEvent({ id: "native", title: "Test", start: "2026-10-21T10:00:00", end: "2026-10-21T11:00:00", allDay: false });
  app.addEvent(event);
  assert.equal(changes.at(-1).type, "create");
  await app.updateEvent(event.id, { title: "Resized" }, false, "resize");
  assert.equal(changes.at(-1).source, "resize");
  app.applyEventsChanges({ update: [{ id: event.id, updates: { title: "Restored" } }] }, false, "remote");
  assert.equal(changes.at(-1).source, "remote");
  await app.deleteEvent(event.id);
  assert.equal(changes.at(-1).type, "delete");
  unsubscribe();
});
