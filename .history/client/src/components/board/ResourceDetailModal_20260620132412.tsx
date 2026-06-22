// src/components/board/ResourceDetailModal.tsx
import { useState } from 'react';
import { RiDeleteBinLine } from 'react-icons/ri';
import { Modal } from '../ui/Modal';
import { ResourceForm } from './ResourceForm';
import { ChecklistEditor } from './ChecklistEditor';
import type { BoardController, BoardItem } from './ResourceBoard';

interface ResourceDetailModalProps<T extends BoardItem, TCreate, TUpdate> {
  item: T;
  showKey: boolean;
  resourceLabel: string;
  controller: BoardController<T, TCreate, TUpdate>;
  onClose: () => void;
}

export function ResourceDetailModal<T extends BoardItem, TCreate, TUpdate>({
  item,
  showKey,
  resourceLabel,
  controller,
  onClose,
}: ResourceDetailModalProps<T, TCreate, TUpdate>) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <Modal title={`${resourceLabel} details`} onClose={onClose} widthClassName="max-w-xl">
      <ResourceForm
        showKey={showKey}
        initial={{ key: item.key ?? '', title: item.title, description: item.description, status: item.status }}
        submitLabel="Save changes"
        onSubmit={async (values) => {
          const payload = showKey
            ? { key: values.key, title: values.title, description: values.description, status: values.status }
            : { title: values.title, description: values.description, status: values.status };
          await controller.update(item.id, payload as unknown as Partial<TUpdate>);
        }}
      />

      <div className="mt-5 pt-4 border-t border-border">
        <h3 className="text-[11px] font-medium text-muted-foreground mb-2 uppercase tracking-wide">Checklist</h3>
        <ChecklistEditor
          items={item.checklist}
          onAdd={(text) => void controller.addChecklistItem(item.id, text)}
          onToggle={(itemId, done) => void controller.updateChecklistItem(item.id, itemId, { done })}
          onEditText={(itemId, text) => void controller.updateChecklistItem(item.id, itemId, { text })}
          onDelete={(itemId) => void controller.deleteChecklistItem(item.id, itemId)}
          onReorder={(positions) => void controller.reorderChecklist(item.id, positions)}
        />
      </div>

      <div className="mt-5 pt-4 border-t border-border flex justify-end">
        {confirmingDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Delete this {resourceLabel.toLowerCase()}?</span>
            <button
              onClick={async () => {
                await controller.remove(item.id);
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-sm transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-sm transition-colors"
          >
            <RiDeleteBinLine className="text-[14px]" />
            Delete {resourceLabel}
          </button>
        )}
      </div>
    </Modal>
  );
}
