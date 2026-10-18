export type SkillInput = {
  name: string;
  description: string;
  instructions: string;
  executor: "instructions" | "jira_release_components";
  project: string;
  release: string;
};
export type Skill = SkillInput & {
  id: string;
  created_at: string;
  updated_at: string;
};
export type JiraIssue = {
  key: string;
  summary: string;
  status: string;
  url: string;
};
export type SkillResult = {
  project: string;
  release: string;
  jql: string;
  retrieved_at: string;
  issue_count: number;
  total: number | null;
  truncated: boolean;
  instructions: string;
  components: { id: string; name: string; issues: JiraIssue[] }[];
  unassigned: JiraIssue[];
};
