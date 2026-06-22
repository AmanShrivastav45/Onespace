import { api } from './client';
import { createResourceApi } from './resourceApi';
import type { Priority, Resolution, Status, Ticket } from '../types/resources';

export interface TicketCreate {
  key: string;
  title: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  severity?: Priority;
  resolution?: Resolution;
  components?: string[];
  labels?: string[];
  fixVersion?: string;
  responsibleTeam?: string;
  associatedGroup?: string;
  ticketRequester?: string;
  detectedInRelease?: string;
  assignee?: string;
  secondAssignee?: string;
  reporter?: string;
}

export type TicketUpdate = TicketCreate;

export interface SubtaskCreate {
  jiraLink?: string;
  title: string;
  description?: string;
}

const baseTicketsApi = createResourceApi<Ticket, TicketCreate, TicketUpdate>('/tickets');

export const ticketsApi = {
  ...baseTicketsApi,
  addComment: (id: string, body: string) => api.post<Ticket>(`/tickets/${id}/comments`, { body }),
  addSubtask: (id: string, payload: SubtaskCreate) => api.post<Ticket>(`/tickets/${id}/subtasks`, payload),
  toggleSubtask: (id: string, subtaskId: string, done: boolean) =>
    api.patch<Ticket>(`/tickets/${id}/subtasks/${subtaskId}`, { done }),
};
