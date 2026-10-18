import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { FiEdit2, FiPlay, FiTrash2, FiX, FiBookOpen } from "react-icons/fi";
import { api } from "../api/client";
import { PageWorkspace } from "../components/layout/PageWorkspace";
import type { Skill, SkillInput, SkillResult } from "../types/skill";
import { SkillResults } from "../components/skills/SkillResults";

const field =
  "mt-1.5 block w-full rounded-md border border-[#e4ddeb] bg-white px-3 py-2 text-[length:calc(0.7857rem*var(--main-font-scale))] text-[#62596c] outline-none focus:border-[#ac91cb]";
const button =
  "inline-flex items-center gap-1.5 rounded-md border border-[#e5dfec] bg-white px-3 py-2 text-[length:calc(0.7143rem*var(--main-font-scale))] text-[#8066b3] hover:bg-[#faf8fd] disabled:opacity-50";
const primary =
  "inline-flex items-center gap-1.5 rounded-md bg-[#8066c6] px-3 py-2 text-[length:calc(0.7143rem*var(--main-font-scale))] text-white hover:bg-[#6d54b1] disabled:opacity-50";
const emptySkill = (): SkillInput => ({
  name: "",
  description: "",
  instructions: "",
  executor: "instructions",
  project: "",
  release: "",
});
const message = (error: unknown, fallback: string) =>
  axios.isAxiosError(error) && typeof error.response?.data?.detail === "string"
    ? error.response.data.detail
    : fallback;

export function SkillsPage({
  createRequested,
  onCreateHandled,
}: {
  createRequested: boolean;
  onCreateHandled: () => void;
}) {
  const [skills, setSkills] = useState<Skill[]>([]),
    [selectedId, setSelectedId] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [draft, setDraft] = useState<(SkillInput & { id?: string }) | null>(
      null,
    ),
    [saving, setSaving] = useState(false),
    [editorError, setEditorError] = useState("");
  const [project, setProject] = useState(""),
    [release, setRelease] = useState(""),
    [running, setRunning] = useState(false);
  const [result, setResult] = useState<SkillResult | null>(null),
    [runError, setRunError] = useState(""),
    [confirmDelete, setConfirmDelete] = useState(false);
  const runAbort = useRef<AbortController | null>(null);
  const selected = skills.find((skill) => skill.id === selectedId);
  async function load() {
    try {
      const { data } = await api.get<{
        skills: Skill[];
        jira_configured: boolean;
      }>("/skills");
      setSkills(data.skills);
      setConfigured(data.jira_configured);
      setSelectedId((id) =>
        data.skills.some((skill) => skill.id === id)
          ? id
          : (data.skills[0]?.id ?? null),
      );
      setError("");
    } catch (e) {
      setError(
        message(e, "Could not load skills. Check the backend and retry."),
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
    return () => runAbort.current?.abort();
  }, []);
  useEffect(() => {
    if (createRequested) {
      setDraft(emptySkill());
      setEditorError("");
      onCreateHandled();
    }
  }, [createRequested, onCreateHandled]);
  useEffect(() => {
    runAbort.current?.abort();
    setRunning(false);
    setProject(selected?.project || "");
    setRelease(selected?.release || "");
    setResult(null);
    setRunError("");
    setConfirmDelete(false);
  }, [selectedId]);
  async function save() {
    if (!draft) return;
    setSaving(true);
    setEditorError("");
    try {
      const { data } = draft.id
        ? await api.put<Skill>(`/skills/${draft.id}`, draft)
        : await api.post<Skill>("/skills", draft);
      await load();
      setSelectedId(data.id);
      setProject(data.project);
      setRelease(data.release);
      setResult(null);
      setDraft(null);
    } catch (e) {
      setEditorError(
        message(e, "Could not save. Check the required fields and try again."),
      );
    } finally {
      setSaving(false);
    }
  }
  async function remove() {
    if (!selected) return;
    setSaving(true);
    setRunError("");
    try {
      await api.delete(`/skills/${selected.id}`);
      await load();
    } catch (e) {
      setRunError(message(e, "Could not delete the skill."));
    } finally {
      setSaving(false);
    }
  }
  async function run() {
    if (!selected) return;
    const controller = new AbortController();
    runAbort.current = controller;
    setRunning(true);
    setRunError("");
    setResult(null);
    try {
      const { data } = await api.post<SkillResult>(
        `/skills/${selected.id}/run`,
        { project: project.trim(), release: release.trim() },
        { signal: controller.signal, timeout: 180000 },
      );
      if (!controller.signal.aborted) setResult(data);
    } catch (e) {
      if (!controller.signal.aborted)
        setRunError(
          message(
            e,
            "The skill could not finish. Check the server and your company network, then retry.",
          ),
        );
    } finally {
      if (!controller.signal.aborted) setRunning(false);
    }
  }
  return (
    <>
      {error && (
        <div
          role="alert"
          className="shrink-0 bg-amber-50 p-3 text-[length:calc(0.7857rem*var(--main-font-scale))] text-amber-900"
        >
          {error}
          <button className="ml-2 underline" onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}
      <PageWorkspace
        sidebarLabel="Saved skills"
        sidebar={
          <div className="space-y-3 p-3">
            {loading && (
              <p className="p-4 text-[length:calc(0.7857rem*var(--main-font-scale))] text-[#9b93a5]">
                Loading…
              </p>
            )}
            {!loading && !skills.length && (
              <p className="p-4 text-[length:calc(0.7857rem*var(--main-font-scale))] text-[#9b93a5]">
                No skills yet. Create one to save reusable instructions.
              </p>
            )}
            {skills.map((skill) => (
              <button
                key={skill.id}
                aria-pressed={selectedId === skill.id}
                className={`block w-full rounded-md border p-4 text-left ${selectedId === skill.id ? "border-[#d9cbe9] bg-[#f6f2fb]" : "border-[#e9e3f0] bg-white hover:bg-[#fcfbfe]"}`}
                onClick={() => setSelectedId(skill.id)}
              >
                <strong className="block text-[length:calc(0.7857rem*var(--main-font-scale))] font-medium [overflow-wrap:anywhere]">
                  {skill.name}
                </strong>
                <span className="mt-1 block text-[length:calc(0.7143rem*var(--main-font-scale))] leading-relaxed text-[#9b93a5]">
                  {skill.description || "No description"}
                </span>
                <span className="mt-2 block text-[length:calc(0.5714rem*var(--main-font-scale))] text-[#a38abf]">
                  {skill.executor === "jira_release_components"
                    ? "Jira · release components"
                    : "Instructions only"}
                </span>
              </button>
            ))}
          </div>
        }
      >
        {selected && (
          <section className="min-w-0 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-[length:calc(1rem*var(--main-font-scale))] font-medium">
                  {selected.name}
                </h2>
                <p className="mt-1 text-[length:calc(0.7857rem*var(--main-font-scale))] text-[#9b93a5]">
                  {selected.description}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className={button}
                  disabled={running}
                  onClick={() => {
                    setDraft({ ...selected });
                    setEditorError("");
                  }}
                >
                  <FiEdit2 /> Edit
                </button>
                <button
                  className={button}
                  aria-label="Delete skill"
                  disabled={running}
                  onClick={() => setConfirmDelete((value) => !value)}
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
            {confirmDelete && (
              <div className="mt-3 rounded-md bg-[#faf2f3] p-3 text-[length:calc(0.7143rem*var(--main-font-scale))] text-[#a5707d]">
                Delete this saved skill? Jira issues will not change.
                <div className="mt-2 flex gap-2">
                  <button
                    className={button}
                    disabled={saving}
                    onClick={() => void remove()}
                  >
                    Delete skill
                  </button>
                  <button
                    className={button}
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <h3 className="mt-5 text-[length:calc(0.7143rem*var(--main-font-scale))] font-medium text-[#8c8396]">
              Instructions
            </h3>
            <p className="mt-2 whitespace-pre-wrap rounded-lg bg-[#faf9fc] p-4 text-[length:calc(0.7857rem*var(--main-font-scale))] leading-relaxed text-[#756b80] [overflow-wrap:anywhere]">
              {selected.instructions}
            </p>
            {selected.executor === "jira_release_components" ? (
              <>
                <form
                  className="mt-5"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void run();
                  }}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-[length:calc(0.7143rem*var(--main-font-scale))] text-[#8c8396]">
                      Project key
                      <input
                        className={field}
                        required
                        pattern="[A-Za-z][A-Za-z0-9_]*"
                        value={project}
                        disabled={running}
                        onChange={(e) => setProject(e.target.value)}
                      />
                    </label>
                    <label className="text-[length:calc(0.7143rem*var(--main-font-scale))] text-[#8c8396]">
                      Fix Version / release
                      <input
                        className={field}
                        required
                        maxLength={100}
                        value={release}
                        disabled={running}
                        onChange={(e) => setRelease(e.target.value)}
                      />
                    </label>
                  </div>
                  <p className="mt-3 text-[length:calc(0.6429rem*var(--main-font-scale))] leading-relaxed text-[#9b93a5]">
                    This action searches Jira using the project and Fix Version
                    above, then groups the matching issues by component.
                    Instructions are saved guidance; they do not change this
                    action's query logic. No LLM is needed.
                  </p>
                  {!configured && (
                    <div className="mt-4 rounded-md border border-[#ede5f5] bg-[#faf7fd] p-3 text-[length:calc(0.7143rem*var(--main-font-scale))] leading-relaxed text-[#9b86ae]">
                      Jira is not configured. Add <code>JIRA_BASE_URL</code> and{" "}
                      <code>JIRA_TOKEN</code> to <code>server/.env</code>,
                      restart the backend, then{" "}
                      <button
                        type="button"
                        className="underline"
                        onClick={() => void load()}
                      >
                        refresh configuration status
                      </button>
                      . Your token stays on the server.
                    </div>
                  )}
                  <button
                    type="submit"
                    className={`${primary} mt-4`}
                    disabled={
                      running ||
                      !configured ||
                      !project.trim() ||
                      !release.trim()
                    }
                  >
                    <FiPlay />
                    {running ? "Retrieving release components…" : "Run skill"}
                  </button>
                </form>
              </>
            ) : (
              <p className="mt-5 flex items-center gap-2 text-[length:calc(0.7143rem*var(--main-font-scale))] text-[#9b93a5]">
                <FiBookOpen />
                These instructions are saved for reuse. Choose the Jira action
                in Edit to enable a supported run.
              </p>
            )}
            {runError && (
              <p
                role="alert"
                className="mt-4 rounded-md bg-amber-50 p-3 text-[length:calc(0.7143rem*var(--main-font-scale))] text-amber-900"
              >
                {runError}
              </p>
            )}
            {result && <SkillResults result={result} />}
          </section>
        )}
      </PageWorkspace>
      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2e21374d] p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="skill-editor-title"
            className="flex max-h-[90dvh] w-full max-w-[620px] flex-col rounded-xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-[#efedf3] p-5">
              <h2
                id="skill-editor-title"
                className="text-[length:calc(1rem*var(--main-font-scale))] font-medium"
              >
                {draft.id ? "Edit skill" : "Create skill"}
              </h2>
              <button
                aria-label="Close skill editor"
                disabled={saving}
                onClick={() => setDraft(null)}
              >
                <FiX />
              </button>
            </div>
            <form
              className="overflow-y-auto p-5"
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              <label className="mb-4 block text-[length:calc(0.7143rem*var(--main-font-scale))] text-[#8c8396]">
                Name
                <input
                  className={field}
                  autoFocus
                  required
                  maxLength={200}
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </label>
              <label className="mb-4 block text-[length:calc(0.7143rem*var(--main-font-scale))] text-[#8c8396]">
                Description
                <input
                  className={field}
                  maxLength={1000}
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                />
              </label>
              <label className="mb-4 block text-[length:calc(0.7143rem*var(--main-font-scale))] text-[#8c8396]">
                Action
                <select
                  className={field}
                  value={draft.executor}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      executor: e.target.value as SkillInput["executor"],
                    })
                  }
                >
                  <option value="instructions">Save instructions only</option>
                  <option value="jira_release_components">
                    Jira: retrieve release components
                  </option>
                </select>
              </label>
              <label className="mb-4 block text-[length:calc(0.7143rem*var(--main-font-scale))] text-[#8c8396]">
                Instructions
                <textarea
                  className={`${field} min-h-[150px] resize-y`}
                  required
                  maxLength={20000}
                  value={draft.instructions}
                  onChange={(e) =>
                    setDraft({ ...draft, instructions: e.target.value })
                  }
                  placeholder="Describe what this skill should do and how the result should be presented."
                />
              </label>
              <p className="mb-4 text-[length:calc(0.6429rem*var(--main-font-scale))] text-[#9b93a5]">
                Use {"{{project}}"} and {"{{release}}"} as placeholders in
                reusable Jira instructions.
              </p>
              {draft.executor === "jira_release_components" && (
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <label className="text-[length:calc(0.7143rem*var(--main-font-scale))] text-[#8c8396]">
                    Default project
                    <input
                      className={field}
                      value={draft.project}
                      maxLength={100}
                      onChange={(e) =>
                        setDraft({ ...draft, project: e.target.value })
                      }
                    />
                  </label>
                  <label className="text-[length:calc(0.7143rem*var(--main-font-scale))] text-[#8c8396]">
                    Default release
                    <input
                      className={field}
                      value={draft.release}
                      maxLength={100}
                      onChange={(e) =>
                        setDraft({ ...draft, release: e.target.value })
                      }
                    />
                  </label>
                </div>
              )}
              {editorError && (
                <p
                  role="alert"
                  className="mb-4 text-[length:calc(0.7143rem*var(--main-font-scale))] text-amber-800"
                >
                  {editorError}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className={button}
                  disabled={saving}
                  onClick={() => setDraft(null)}
                >
                  Cancel
                </button>
                <button
                  className={primary}
                  disabled={
                    saving || !draft.name.trim() || !draft.instructions.trim()
                  }
                >
                  {saving ? "Saving…" : "Save skill"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
