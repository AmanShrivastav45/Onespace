// src/components/layout/LeftSidebar.tsx
import { RiArrowLeftSLine, RiArrowRightSLine, RiHardDrive2Line } from 'react-icons/ri';
import { useSidebarCtx } from '../../context/SidebarContext';
import { SidebarTab } from '../ui/SidebarTab';
import type { TabConfig } from '../../types/sidebar';

interface LeftSidebarProps {
  tabs: TabConfig[];
}

export function LeftSidebar({ tabs }: LeftSidebarProps) {
  const { isLeftOpen, toggleLeft } = useSidebarCtx();

  return (
    <aside className="flex flex-col h-full bg-sidebar border-r border-sidebar-border overflow-hidden">
      {/* Header */}
      <div
        className={`flex items-center h-14 px-3 border-b border-sidebar-border shrink-0 ${
          isLeftOpen ? 'justify-between' : 'justify-center'
        }`}
      >
        <div
          className={`flex items-center gap-2.5 overflow-hidden transition-[opacity,max-width] duration-200 ${
            isLeftOpen ? 'opacity-100 max-w-[180px]' : 'opacity-0 max-w-0'
          }`}
        >
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-primary-foreground">T</span>
          </div>
          <span className="text-sm font-semibold text-sidebar-foreground whitespace-nowrap tracking-tight">
            TaskBoard
          </span>
        </div>

        <button
          onClick={toggleLeft}
          className="p-1.5 rounded-md text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors shrink-0"
          aria-label={isLeftOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isLeftOpen ? (
            <RiArrowLeftSLine className="text-[16px]" />
          ) : (
            <RiArrowRightSLine className="text-[16px]" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2 py-3 overflow-y-auto">
        {tabs.map((tab) => (
          <SidebarTab key={tab.path} {...tab} isOpen={isLeftOpen} />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-2 py-3 shrink-0">
        <div
          className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground"
          title={!isLeftOpen ? 'Stored locally as JSON' : undefined}
        >
          <RiHardDrive2Line className="text-[16px] shrink-0" />
          <span
            className={`whitespace-nowrap overflow-hidden text-xs transition-[opacity,max-width] duration-200 ${
              isLeftOpen ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0'
            }`}
          >
            Stored locally as JSON
          </span>
        </div>
      </div>
    </aside>
  );
}
