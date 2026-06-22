// src/components/board/ResourceBoard.tsx
import { useMemo, useState } from 'react';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { RiAddLine } from 'react-icons/ri';
import { Modal } from '../ui/Modal';
import { ResourceCard } from './ResourceCard';
import { ResourceForm } from './ResourceForm';
import { ResourceDetailModal } from './ResourceDetailModal';
import type { ChecklistItem, Status } from '../../types/resources';

export interface BoardItem {
  id: string;
  key?: string;
  title: string;
  description: string;
  status: Status;
  order: number;
  createdAt: string;
  updatedAt: string;
  checklist: ChecklistItem[];
}

export interface ReorderPositionLike {
  id: string;
  order: number;
}

export interface BoardController<T, TCreate, TUpdate> {
  create: (data: TCreate) => Promise<T>;
  update: (id: string, data: Partial<TUpdate>) => Promise<T>;
  remove: (id: string) => Promise<void>;
  reorder: (positions: ReorderPositionLike[]) => Promise<T[]>;
  addChecklistItem: (id: string, text: string) => Promise<T>;
  updateChecklistItem: (id: string, itemId: string, data: Partial<Pick<ChecklistItem, 'text' | 'done'>>) => Promise<T>;
  deleteChecklistItem: (id: string, itemId: string) => Promise<T>;
  reorderChecklist: (id: string, positions: ReorderPositionLike[]) => Promise<T>;
}

interface ResourceBoardProps<T extends BoardItem, TCreate, TUpdate> {
  items: T[];
  controller: BoardController<T, TCreate, TUpdate>;
  showKey: boolean;
  resourceLabel: string;
  emptyHint: string;
}

export function ResourceBoard<T extends BoardItem, TCreate, TUpdate>({
  items,
  controller,
  showKey,
  resourceLabel,
  emptyHint,
}: ResourceBoardProps<T, TCreate, TUpdate>) {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sorted = useMemo(() => [...items].sort((a, b) => a.order - b.order), [items]);
  const activeItem = sorted.find((i) => i.id === activeId) ?? null;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sorted.findIndex((i) => i.id === active.id);
    const newIndex = sorted.findIndex((i) => i.id === over.id);
    const moved = arrayMove(sorted, oldIndex, newIndex);
    void controller.reorder(moved.map((item, index) => ({ id: item.id, order: index })));
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary-active rounded-sm transition-colors"
        >
          <RiAddLine className="text-[14px]" />
          New {resourceLabel}
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="border border-dashed border-border rounded-sm py-12 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">{emptyHint}</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sorted.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-2">
              {sorted.map((item) => (
                <ResourceCard key={item.id} item={item} showKey={showKey} onOpen={() => setActiveId(item.id)} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {isCreateOpen && (
        <Modal title={`New ${resourceLabel}`} onClose={() => setCreateOpen(false)}>
          <ResourceForm
            showKey={showKey}
            submitLabel="Create"
            onSubmit={async (values) => {
              const payload = showKey
                ? { key: values.key, title: values.title, description: values.description, status: values.status }
                : { title: values.title, description: values.description, status: values.status };
              await controller.create(payload as unknown as TCreate);
              setCreateOpen(false);
            }}
          />
        </Modal>
      )}

      {activeItem && (
        <ResourceDetailModal
          item={activeItem}
          showKey={showKey}
          resourceLabel={resourceLabel}
          controller={controller}
          onClose={() => setActiveId(null)}
        />
      )}
    </div>
  );
}
