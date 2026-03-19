/**
 * AppShell global: TopContextBar, SidebarNav, MainHeader, WorkspaceContent, OfflineSyncBar.
 */
import { useState, ReactNode } from 'react';
import { TopContextBar } from './TopContextBar';
import { SidebarNav } from './SidebarNav';
import { OfflineSyncBar } from './OfflineSyncBar';
import { DemoConversionBanner } from '@/components/demo/DemoConversionBanner';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SidebarNav isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-background border-b border-border z-30 flex items-center px-4">
          <button
            type="button"
            className="p-2 -ml-2 rounded-md hover:bg-muted"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="ml-2 font-medium text-foreground">Nova Silva</span>
        </header>
        <div className="lg:hidden h-14" />
        <TopContextBar />
        <DemoConversionBanner />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <OfflineSyncBar />
      </div>
    </div>
  );
}
