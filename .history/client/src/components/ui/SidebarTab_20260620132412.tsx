// src/components/ui/SidebarTab.tsx
import { NavLink } from 'react-router-dom';
import type { IconType } from 'react-icons';

interface SidebarTabProps {
  icon: IconType;
  label: string;
  path: string;
  isOpen: boolean;
}

export function SidebarTab({ icon: Icon, label, path, isOpen }: SidebarTabProps) {
  return (
    <NavLink
      to={path}
      title={!isOpen ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-sm transition-colors duration-150 group text-sm ${
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={`shrink-0 text-[16px] ${
              isActive ? 'text-sidebar-accent-foreground' : 'text-muted-foreground group-hover:text-sidebar-accent-foreground'
            }`}
          />
          <span
            className={`whitespace-nowrap overflow-hidden transition-[opacity,max-width] duration-200 ${
              isOpen ? 'opacity-100 max-w-[180px]' : 'opacity-0 max-w-0'
            }`}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}
