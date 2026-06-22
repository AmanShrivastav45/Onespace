// src/types/sidebar.ts
import type { IconType } from 'react-icons';

export interface TabConfig {
  label: string;
  path: string;
  icon: IconType;
}

export interface SidebarContextValue {
  isRightOpen: boolean;
  toggleRight: () => void;
}
