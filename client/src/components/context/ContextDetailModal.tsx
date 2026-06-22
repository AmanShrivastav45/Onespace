// src/components/context/ContextDetailModal.tsx
import { useState } from 'react';
import { RiDeleteBinLine } from 'react-icons/ri';
import { Modal } from '../ui/Modal';
import { ContextForm } from './ContextForm';
import type { ContextEntry } from '../../types/resources';
import type { ContextEntryUpdate } from '../../api/context';

interface ContextDetailModalProps {
  entry: ContextEntry;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<ContextEntryUpdate>) => Promise<ContextEntry>;
  onDelete: (id: string) => Promise<void>;
}

export function ContextDetailModal({ entry, onClose, onUpdate, onDelete }: ContextDetailModalProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <Modal title="Context entry" onClose={onClose} widthClassName="max-w-xl">
      <ContextForm
        initial={entry}
        submitLabel="Save changes"
        onSubmit={async (values) => {
          await onUpdate(entry.id, values);
        }}
      />

      <div className="mt-5 pt-4 border-t border-border flex justify-end">
        {confirmingDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Delete this entry?</span>
            <button
              onClick={async () => {
                await onDelete(entry.id);
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-normal text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-pill transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className="px-3 py-1.5 text-xs font-normal text-muted-foreground hover:text-foreground hover:bg-accent rounded-pill transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-normal text-destructive hover:bg-destructive/10 rounded-pill transition-colors"
          >
            <RiDeleteBinLine className="text-[14px]" />
            Delete entry
          </button>
        )}
      </div>
    </Modal>
  );
}
