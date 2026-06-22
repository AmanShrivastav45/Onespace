import { api } from './client';
import type { ChecklistItem } from '../types/resources';

export interface ReorderPosition {
  id: string;
  order: number;
}

interface BaseItem {
  id: string;
}

export function createResourceApi<T extends BaseItem, TCreate, TUpdate>(basePath: string) {
  return {
    list: () => api.get<T[]>(basePath),
    create: (data: TCreate) => api.post<T>(basePath, data),
    update: (id: string, data: Partial<TUpdate>) => api.patch<T>(`${basePath}/${id}`, data),
    remove: (id: string) => api.del<void>(`${basePath}/${id}`),
    reorder: (positions: ReorderPosition[]) => api.patch<T[]>(`${basePath}/reorder`, positions),
    addChecklistItem: (id: string, text: string) => api.post<T>(`${basePath}/${id}/checklist`, { text }),
    updateChecklistItem: (id: string, itemId: string, data: Partial<Pick<ChecklistItem, 'text' | 'done'>>) =>
      api.patch<T>(`${basePath}/${id}/checklist/${itemId}`, data),
    deleteChecklistItem: (id: string, itemId: string) => api.del<T>(`${basePath}/${id}/checklist/${itemId}`),
    reorderChecklist: (id: string, positions: ReorderPosition[]) =>
      api.patch<T>(`${basePath}/${id}/checklist/reorder`, positions),
  };
}
