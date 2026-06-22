import { api } from './client';
import type { Document } from '../types/resources';

export interface DocumentCreate {
  title: string;
  filename?: string;
  content?: string;
}

export interface DocumentUpdate {
  title: string;
  content: string;
}

export const documentsApi = {
  list: () => api.get<Document[]>('/documents'),
  create: (data: DocumentCreate) => api.post<Document>('/documents', data),
  update: (id: string, data: Partial<DocumentUpdate>) => api.patch<Document>(`/documents/${id}`, data),
  remove: (id: string) => api.del<void>(`/documents/${id}`),
};
