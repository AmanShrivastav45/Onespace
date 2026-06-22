// src/context/SidebarContext.tsx
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useSidebar } from '../hooks/useSidebar';
import type { SidebarContextValue } from '../types/sidebar';

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const value = useSidebar();
  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebarCtx(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebarCtx must be used inside <SidebarProvider>');
  return ctx;
}
