import type { ReactNode } from "react";

export function PageWorkspace({
  sidebar,
  children,
  sidebarLabel,
}: {
  sidebar: ReactNode;
  children: ReactNode;
  sidebarLabel: string;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-green-100 min-[1100px]:flex-row">
      <aside
        aria-label={sidebarLabel}
        style={{ scrollbarGutter: "auto" }}
        className="stable-scroll max-h-[230px] shrink-0 overflow-y-auto border-b border-[#eeebf3] bg-[#fcfbfe] min-[1100px]:h-full min-[1100px]:max-h-none min-[1100px]:w-[240px] min-[1100px]:border-r min-[1100px]:border-b-0"
      >
        {sidebar}
      </aside>
      <section
        aria-label="Page content"
        className="stable-scroll min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain bg-white pb-12"
      >
        {children}
      </section>
    </div>
  );
}
