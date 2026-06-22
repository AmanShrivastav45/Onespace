export type Status = 'todo' | 'in_progress' | 'done';

export type Priority = 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';

export type Resolution = 'Unresolved' | 'Resolved' | "Won't Fix" | 'Duplicate' | 'Cannot Reproduce';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  order: number;
}

export interface TicketAttachment {
  id: string;
  name: string;
  sizeKb: number;
  uploadedAt: string;
}

export interface TicketSubtask {
  id: string;
  title: string;
  done: boolean;
  jiraLink: string;
  description: string;
}

export interface TicketComment {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  key: string;
  title: string;
  description: string;
  status: Status;
  order: number;
  createdAt: string;
  updatedAt: string;
  checklist: ChecklistItem[];
  priority: Priority;
  severity: Priority;
  resolution: Resolution;
  components: string[];
  labels: string[];
  fixVersion: string;
  responsibleTeam: string;
  associatedGroup: string;
  ticketRequester: string;
  detectedInRelease: string;
  assignee: string;
  secondAssignee: string;
  reporter: string;
  votes: number;
  watchers: number;
  attachments: TicketAttachment[];
  subtasks: TicketSubtask[];
  comments: TicketComment[];
}

export interface MiscTask {
  id: string;
  title: string;
  description: string;
  status: Status;
  order: number;
  createdAt: string;
  updatedAt: string;
  checklist: ChecklistItem[];
}

export interface ContextEntry {
  id: string;
  title: string;
  description: string;
  summary: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  title: string;
  filename: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
