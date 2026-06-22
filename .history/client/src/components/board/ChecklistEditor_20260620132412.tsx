// src/components/board/ChecklistEditor.tsx
import { useState } from 'react';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RiAddLine, RiCloseLine, RiDraggable } from 'react-icons/ri';
import type { ChecklistItem } from '../../types/resources';

interface ChecklistEditorProps {
  items: ChecklistItem[];
  onAdd: (text: string) => void;
  onToggle: (itemId: string, done: boolean) => void;
  onEditText: (itemId: string, text: string) => void;
  onDelete: (itemId: string) => void;
  onReorder: (positions: { id: string; order: number }[]) => void;
}

interface SortableRowProps {
  item: ChecklistItem;
  onToggle: (id: string, done: boolean) => void;
  onEditText: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

function SortableRow({ item, onToggle, onEditText, onDelete }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const [text, setText] = useState(item.text);

  function commit() {
    const trimmed = text.trim();
    if (trimmed && trimmed !== item.text) onEditText(item.id, trimmed);
    else setText(item.text);
  }

  return (
    <li ref={setNodeRef} style={style} className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent group">
      <button
        {...attributes}
        {...listeners}
        className="text-muted-foreground hover:text-foreground cursor-grab shrink-0"
        aria-label="Drag to reorder"
      >
        <RiDraggable className="text-[14px]" />
      </button>
      <input
        type="checkbox"
        checked={item.done}
        onChange={(e) => onToggle(item.id, e.target.checked)}
        className="shrink-0 accent-primary w-3.5 h-3.5"
      />
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        className={`flex-1 bg-transparent text-sm outline-none ${item.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}
      />
      <button
        onClick={() => onDelete(item.id)}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
        aria-label="Delete item"
      >
        <RiCloseLine className="text-[14px]" />
      </button>
    </li>
  );
}

export function ChecklistEditor({ items, onAdd, onToggle, onEditText, onDelete, onReorder }: ChecklistEditorProps) {
  const [draft, setDraft] = useState('');
  const sorted = [...items].sort((a, b) => a.order - b.order);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sorted.findIndex((i) => i.id === active.id);
    const newIndex = sorted.findIndex((i) => i.id === over.id);
    const moved = arrayMove(sorted, oldIndex, newIndex);
    onReorder(moved.map((item, index) => ({ id: item.id, order: index })));
  }

  function submitDraft() {
    const text = draft.trim();
    if (!text) return;
    onAdd(text);
    setDraft('');
  }

  return (
    <div>
      {sorted.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sorted.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-0.5 mb-2">
              {sorted.map((item) => (
                <SortableRow
                  key={`${item.id}:${item.text}`}
                  item={item}
                  onToggle={onToggle}
                  onEditText={onEditText}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitDraft();
        }}
        className="flex items-center gap-2 px-2 border border-dashed border-border rounded-sm"
      >
        <RiAddLine className="text-muted-foreground text-[14px] shrink-0" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a checklist item…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground py-1.5"
        />
      </form>
    </div>
  );
}
