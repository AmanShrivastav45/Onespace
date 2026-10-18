import type { ReactNode } from "react";

export function PaneHeader({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[#eeebf3] px-4">
      {children}
    </div>
  );
}
