// src/App.tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RiMarkdownLine, RiStickyNoteLine, RiTaskLine, RiTicketLine } from 'react-icons/ri';
import { SidebarProvider } from './context/SidebarContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { LeftSidebar } from './components/layout/LeftSidebar';
// import { RightSidebar } from './components/layout/RightSidebar'; // disabled — see README "Right sidebar" section to re-enable
import { MainContent } from './components/layout/MainContent';
import TicketsPage from './pages/TicketsPage';
import TicketDetailPage from './pages/TicketDetailPage';
import MiscPage from './pages/MiscPage';
import ContextPage from './pages/ContextPage';
import DocumentsPage from './pages/DocumentsPage';
import DocumentDetailPage from './pages/DocumentDetailPage';
import type { TabConfig } from './types/sidebar';

const TABS: TabConfig[] = [
  { label: 'Jira Tickets', path: '/tickets', icon: RiTicketLine },
  { label: 'Miscellaneous Tasks', path: '/misc', icon: RiTaskLine },
  { label: 'Context', path: '/context', icon: RiStickyNoteLine },
  { label: 'Documents', path: '/documents', icon: RiMarkdownLine },
];

function AppGrid() {
  return (
    <div className="relative h-screen overflow-hidden bg-canvas">
      {/* Left sidebar — absolutely positioned, fixed width, not collapsible */}
      <div className="absolute top-0 left-0 bottom-0 z-20 w-[240px]">
        <LeftSidebar tabs={TABS} />
      </div>

      {/* Middle — fixed 1240px, floats as a card centered both horizontally and vertically */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1240px] h-[85vh] rounded-sm border border-border shadow-lg overflow-hidden">
        <MainContent />
      </div>

      {/* Right sidebar — disabled for now (not deleted). See README "Right sidebar" section
          for what's needed to bring it back. To re-enable: uncomment the RightSidebar import
          above, restore `const { isRightOpen } = useSidebarCtx();` and
          `const rightW = isRightOpen ? 280 : 60;`, and uncomment the block below.
      <div
        className="absolute top-0 right-0 bottom-0 z-20"
        style={{ width: rightW, transition: 'width 200ms ease' }}
      >
        <RightSidebar />
      </div>
      */}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <DataProvider>
          <SidebarProvider>
            <Routes>
              <Route path="/" element={<AppGrid />}>
                <Route index element={<Navigate to="/tickets" replace />} />
                <Route path="tickets" element={<TicketsPage />} />
                <Route path="tickets/:ticketId" element={<TicketDetailPage />} />
                <Route path="misc" element={<MiscPage />} />
                <Route path="context" element={<ContextPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="documents/:documentId" element={<DocumentDetailPage />} />
              </Route>
            </Routes>
          </SidebarProvider>
        </DataProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
