import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { contextApi } from '../api/context';
import type { ContextEntryCreate, ContextEntryUpdate } from '../api/context';
import { documentsApi } from '../api/documents';
import type { DocumentCreate, DocumentUpdate } from '../api/documents';
import { miscApi } from '../api/misc';
import { ticketsApi } from '../api/tickets';
import type { SubtaskCreate } from '../api/tickets';
import { useResourceController } from '../hooks/useResourceController';
import type { ContextEntry, Document, MiscTask, Ticket } from '../types/resources';

function useDataValue() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [miscTasks, setMiscTasks] = useState<MiscTask[]>([]);
  const [contextEntries, setContextEntries] = useState<ContextEntry[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([ticketsApi.list(), miscApi.list(), contextApi.list(), documentsApi.list()])
      .then(([t, m, c, d]) => {
        if (!active) return;
        setTickets(t);
        setMiscTasks(m);
        setContextEntries(c);
        setDocuments(d);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : 'Failed to load data');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const ticketsController = useResourceController(ticketsApi, setTickets);
  const miscController = useResourceController(miscApi, setMiscTasks);

  const addTicketComment = useCallback(async (id: string, body: string) => {
    const ticket = await ticketsApi.addComment(id, body);
    setTickets((prev) => prev.map((t) => (t.id === id ? ticket : t)));
    return ticket;
  }, []);

  const addTicketSubtask = useCallback(async (id: string, payload: SubtaskCreate) => {
    const ticket = await ticketsApi.addSubtask(id, payload);
    setTickets((prev) => prev.map((t) => (t.id === id ? ticket : t)));
    return ticket;
  }, []);

  const toggleTicketSubtask = useCallback(async (id: string, subtaskId: string, done: boolean) => {
    const ticket = await ticketsApi.toggleSubtask(id, subtaskId, done);
    setTickets((prev) => prev.map((t) => (t.id === id ? ticket : t)));
    return ticket;
  }, []);

  const contextController = useMemo(
    () => ({
      create: async (data: ContextEntryCreate) => {
        const entry = await contextApi.create(data);
        setContextEntries((prev) => [entry, ...prev]);
        return entry;
      },
      update: async (id: string, data: Partial<ContextEntryUpdate>) => {
        const entry = await contextApi.update(id, data);
        setContextEntries((prev) => prev.map((e) => (e.id === id ? entry : e)));
        return entry;
      },
      remove: async (id: string) => {
        await contextApi.remove(id);
        setContextEntries((prev) => prev.filter((e) => e.id !== id));
      },
    }),
    [],
  );

  const documentsController = useMemo(
    () => ({
      create: async (data: DocumentCreate) => {
        const document = await documentsApi.create(data);
        setDocuments((prev) => [document, ...prev]);
        return document;
      },
      update: async (id: string, data: Partial<DocumentUpdate>) => {
        const document = await documentsApi.update(id, data);
        setDocuments((prev) => prev.map((d) => (d.id === id ? document : d)));
        return document;
      },
      remove: async (id: string) => {
        await documentsApi.remove(id);
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      },
    }),
    [],
  );

  return {
    tickets,
    miscTasks,
    contextEntries,
    documents,
    loading,
    error,
    ticketsController,
    addTicketComment,
    addTicketSubtask,
    toggleTicketSubtask,
    miscController,
    contextController,
    documentsController,
  };
}

const DataContext = createContext<ReturnType<typeof useDataValue> | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const value = useDataValue();
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside <DataProvider>');
  return ctx;
}
