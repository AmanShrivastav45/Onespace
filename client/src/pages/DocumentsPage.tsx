// src/pages/DocumentsPage.tsx
import { useState } from 'react';
import { RiAddLine } from 'react-icons/ri';
import { Modal } from '../components/ui/Modal';
import { DocumentCard } from '../components/documents/DocumentCard';
import { DocumentForm } from '../components/documents/DocumentForm';
import { useData } from '../context/DataContext';

export default function DocumentsPage() {
  const { documents, documentsController } = useData();
  const [isCreateOpen, setCreateOpen] = useState(false);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-normal text-primary-foreground bg-primary hover:bg-primary-active rounded-pill transition-colors"
        >
          <RiAddLine className="text-[14px]" />
          New Document
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="border border-dashed border-border rounded-sm py-12 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No documents yet — upload your first markdown file.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-3 gap-3">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </ul>
      )}

      {isCreateOpen && (
        <Modal title="New Document" onClose={() => setCreateOpen(false)} widthClassName="max-w-xl">
          <DocumentForm
            submitLabel="Upload"
            onSubmit={async (values) => {
              await documentsController.create(values);
              setCreateOpen(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
