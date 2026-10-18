import type { JiraIssue, SkillResult } from "../../types/skill";

function Issues({ issues }: { issues: JiraIssue[] }) {
  return (
    <ul className="divide-y divide-[#efedf3]">
      {issues.map((issue) => (
        <li
          key={issue.key}
          className="flex flex-wrap items-start gap-2 py-3 text-[length:calc(0.7143rem*var(--main-font-scale))]"
        >
          <a
            className="shrink-0 text-[#8066b3] hover:underline"
            href={issue.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {issue.key}
          </a>
          <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
            {issue.summary}
          </span>
          <span className="rounded bg-[#f4f1f8] px-2 py-0.5 text-[length:calc(0.6429rem*var(--main-font-scale))] text-[#8c8396]">
            {issue.status}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function SkillResults({ result }: { result: SkillResult }) {
  return (
    <section
      aria-label="Skill results"
      className="mt-6 border-t border-[#eaeaf1] pt-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[length:calc(0.9286rem*var(--main-font-scale))] font-medium">
          {result.project} · {result.release}
        </h3>
        <span className="text-[length:calc(0.6429rem*var(--main-font-scale))] text-[#9b93a5]">
          Retrieved {new Date(result.retrieved_at).toLocaleString()}
        </span>
      </div>
      <p className="mt-2 text-[length:calc(0.7143rem*var(--main-font-scale))] text-[#8c8396]">
        {result.components.length} components · {result.issue_count} matching
        issues · {result.unassigned.length} without a component
      </p>
      {result.truncated && (
        <p
          role="status"
          className="mt-3 rounded bg-amber-50 p-3 text-[length:calc(0.7143rem*var(--main-font-scale))] text-amber-900"
        >
          Partial results: the first {result.issue_count} issues were retrieved
          {result.total !== null ? ` out of ${result.total}` : ""}. This is not
          the complete release scope.
        </p>
      )}
      <details className="mt-3 text-[length:calc(0.6429rem*var(--main-font-scale))] text-[#9b93a5]">
        <summary className="cursor-pointer">Query and instructions</summary>
        <pre className="mt-2 whitespace-pre-wrap rounded bg-[#faf9fc] p-3 [overflow-wrap:anywhere]">
          {result.jql}
        </pre>
        <p className="mt-2 whitespace-pre-wrap">{result.instructions}</p>
      </details>
      {result.issue_count === 0 && (
        <p className="mt-5 text-[length:calc(0.7857rem*var(--main-font-scale))] text-[#8c8396]">
          No visible issues match this project and Fix Version. Check the
          release value and your Jira permissions.
        </p>
      )}
      {result.components.map((component) => (
        <section
          key={component.id}
          className="mt-5 rounded-lg border border-[#eaeaf1] px-4"
        >
          <h4 className="border-b border-[#efedf3] py-3 text-[length:calc(0.7857rem*var(--main-font-scale))] font-medium">
            {component.name}{" "}
            <span className="ml-2 font-normal text-[#9b93a5]">
              {component.issues.length}
            </span>
          </h4>
          <Issues issues={component.issues} />
        </section>
      ))}
      {result.unassigned.length > 0 && (
        <section className="mt-5 rounded-lg border border-[#eaeaf1] px-4">
          <h4 className="border-b border-[#efedf3] py-3 text-[length:calc(0.7857rem*var(--main-font-scale))] font-medium">
            Without a component
          </h4>
          <Issues issues={result.unassigned} />
        </section>
      )}
      {result.components.length > 1 && (
        <p className="mt-3 text-[length:calc(0.6429rem*var(--main-font-scale))] text-[#9b93a5]">
          Issues assigned to multiple components appear in each relevant group.
        </p>
      )}
    </section>
  );
}
