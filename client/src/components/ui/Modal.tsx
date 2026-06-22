// src/components/ui/Modal.tsx
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { RiCloseLine } from 'react-icons/ri';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  widthClassName?: string;
}

export function Modal({ title, onClose, children, widthClassName = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas-deep/70 px-4"
      onClick={onClose}
    >
      <div
        className={`w-full ${widthClassName} max-h-[85vh] overflow-y-auto bg-card border border-border rounded-sm p-5`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-normal text-foreground tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <RiCloseLine className="text-[16px]" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
