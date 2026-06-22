// src/hooks/useSidebar.ts
import { useState } from 'react';
import type { SidebarContextValue } from '../types/sidebar';

export function useSidebar(): SidebarContextValue {
  const [isRightOpen, setIsRightOpen] = useState(true);

  return {
    isRightOpen,
    toggleRight: () => setIsRightOpen((p) => !p),
  };
}
