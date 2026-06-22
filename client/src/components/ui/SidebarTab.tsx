// src/components/ui/SidebarTab.tsx
import { NavLink } from 'react-router-dom';
import type { IconType } from 'react-icons';

interface SidebarTabProps {
  icon: IconType;
  label: string;
  path: string;
}

export function SidebarTab({ icon: Icon, label, path }: SidebarTabProps) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-pill transition-colors duration-150 group text-sm font-normal ${
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
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
          <span className="whitespace-nowrap">{label}</span>
        </>
      )}
    </NavLink>
  );
}
