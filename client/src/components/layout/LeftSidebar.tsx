// src/components/layout/LeftSidebar.tsx
import { RiHardDrive2Line, RiMoonLine, RiSunLine } from 'react-icons/ri';
import { useTheme } from '../../context/ThemeContext';
import { SidebarTab } from '../ui/SidebarTab';
import type { TabConfig } from '../../types/sidebar';

interface LeftSidebarProps {
  tabs: TabConfig[];
}

export function LeftSidebar({ tabs }: LeftSidebarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="flex flex-col h-full bg-sidebar border-r border-sidebar-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 h-14 px-3 border-b border-sidebar-border shrink-0">
        <div className="w-6 h-6 rounded-sm bg-primary flex items-center justify-center shrink-0">
          <span className="text-[11px] font-normal text-primary-foreground">T</span>
        </div>
        <span className="text-sm font-normal text-sidebar-foreground whitespace-nowrap tracking-tight">
          TaskBoard
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2 py-3 overflow-y-auto">
        {tabs.map((tab) => (
          <SidebarTab key={tab.path} {...tab} />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-2 py-3 shrink-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-3 px-3 py-2 rounded-sm text-muted-foreground">
          <RiHardDrive2Line className="text-[16px] shrink-0" />
          <span className="whitespace-nowrap text-xs">Stored locally as JSON</span>
        </div>

        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2 rounded-pill text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {theme === 'dark' ? (
            <RiSunLine className="text-[16px] shrink-0" />
          ) : (
            <RiMoonLine className="text-[16px] shrink-0" />
          )}
          <span className="whitespace-nowrap text-xs">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </div>
    </aside>
  );
}
