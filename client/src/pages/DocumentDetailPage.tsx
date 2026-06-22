// src/pages/DocumentDetailPage.tsx
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RiDeleteBinLine, RiPencilLine } from 'react-icons/ri';
import { useData } from '../context/DataContext';
import { Modal } from '../components/ui/Modal';
import { DocumentForm } from '../components/documents/DocumentForm';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function DocumentDetailPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { documents, documentsController, loading } = useData();
  const [isEditOpen, setEditOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const doc = documents.find((d) => d.id === documentId);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (!doc) {
    return (
      <div className="border border-dashed border-border rounded-sm py-12 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Document not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center justify-between gap-3 mb-1">
          <h1 className="text-lg font-normal text-foreground">{doc.title}</h1>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-normal text-foreground border border-border hover:bg-accent rounded-pill transition-colors"
            >
              <RiPencilLine className="text-[14px]" />
              Edit
            </button>
            {confirmingDelete ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    await documentsController.remove(doc.id);
                    navigate('/documents');
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
                Delete
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {doc.filename && <span className="font-mono mr-2">{doc.filename}</span>}
          Updated {formatDateTime(doc.updatedAt)}
        </p>
      </div>

      <div className="bg-card border border-border rounded-sm p-5">
        {doc.content ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.content}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No content.</p>
        )}
      </div>

      {isEditOpen && (
        <Modal title="Edit document" onClose={() => setEditOpen(false)} widthClassName="max-w-2xl">
          <DocumentForm
            initial={doc}
            submitLabel="Save changes"
            onSubmit={async (values) => {
              await documentsController.update(doc.id, { title: values.title, content: values.content });
              setEditOpen(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
