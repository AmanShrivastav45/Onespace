import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ReorderPosition } from '../api/resourceApi';
import type { ChecklistItem } from '../types/resources';

interface BaseItem {
  id: string;
  checklist: ChecklistItem[];
}

interface ResourceApi<T, TCreate, TUpdate> {
  create: (data: TCreate) => Promise<T>;
  update: (id: string, data: Partial<TUpdate>) => Promise<T>;
  remove: (id: string) => Promise<void>;
  reorder: (positions: ReorderPosition[]) => Promise<T[]>;
  addChecklistItem: (id: string, text: string) => Promise<T>;
  updateChecklistItem: (id: string, itemId: string, data: Partial<Pick<ChecklistItem, 'text' | 'done'>>) => Promise<T>;
  deleteChecklistItem: (id: string, itemId: string) => Promise<T>;
  reorderChecklist: (id: string, positions: ReorderPosition[]) => Promise<T>;
}

export function useResourceController<T extends BaseItem, TCreate, TUpdate>(
  api: ResourceApi<T, TCreate, TUpdate>,
  setItems: Dispatch<SetStateAction<T[]>>,
) {
  const replaceItem = useCallback(
    (item: T) => setItems((prev) => prev.map((p) => (p.id === item.id ? item : p))),
    [setItems],
  );

  const create = useCallback(
    async (data: TCreate) => {
      const item = await api.create(data);
      setItems((prev) => [...prev, item]);
      return item;
    },
    [api, setItems],
  );

  const update = useCallback(
    async (id: string, data: Partial<TUpdate>) => {
      const item = await api.update(id, data);
      replaceItem(item);
      return item;
    },
    [api, replaceItem],
  );

  const remove = useCallback(
    async (id: string) => {
      await api.remove(id);
      setItems((prev) => prev.filter((p) => p.id !== id));
    },
    [api, setItems],
  );

  const reorder = useCallback(
    async (positions: ReorderPosition[]) => {
      const items = await api.reorder(positions);
      setItems(items);
      return items;
    },
    [api, setItems],
  );

  const addChecklistItem = useCallback(
    async (id: string, text: string) => {
      const item = await api.addChecklistItem(id, text);
      replaceItem(item);
      return item;
    },
    [api, replaceItem],
  );

  const updateChecklistItem = useCallback(
    async (id: string, itemId: string, data: Partial<Pick<ChecklistItem, 'text' | 'done'>>) => {
      const item = await api.updateChecklistItem(id, itemId, data);
      replaceItem(item);
      return item;
    },
    [api, replaceItem],
  );

  const deleteChecklistItem = useCallback(
    async (id: string, itemId: string) => {
      const item = await api.deleteChecklistItem(id, itemId);
      replaceItem(item);
      return item;
    },
    [api, replaceItem],
  );

  const reorderChecklist = useCallback(
    async (id: string, positions: ReorderPosition[]) => {
      const item = await api.reorderChecklist(id, positions);
      replaceItem(item);
      return item;
    },
    [api, replaceItem],
  );

  return {
    create,
    update,
    remove,
    reorder,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    reorderChecklist,
  };
}
