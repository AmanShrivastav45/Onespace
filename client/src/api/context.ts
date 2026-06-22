import { api } from './client';
import type { ContextEntry } from '../types/resources';

export interface ContextEntryCreate {
  title: string;
  description?: string;
  summary?: string;
  tags?: string[];
}

export interface ContextEntryUpdate {
  title: string;
  description: string;
  summary: string;
  tags: string[];
}

export const contextApi = {
  list: () => api.get<ContextEntry[]>('/context'),
  search: (tag: string) => api.get<ContextEntry[]>(`/context/search?tag=${encodeURIComponent(tag)}`),
  create: (data: ContextEntryCreate) => api.post<ContextEntry>('/context', data),
  update: (id: string, data: Partial<ContextEntryUpdate>) => api.patch<ContextEntry>(`/context/${id}`, data),
  remove: (id: string) => api.del<void>(`/context/${id}`),
};
