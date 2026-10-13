import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { Menu } from 'lucide-react';
import { cn } from '../utils/cn';

export default function Layout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isSpecialtyGuidance = useLocation().pathname === '/specialty-guidance';

  return (
    <div className="flex h-screen min-h-0 bg-[#F7F9FB] dark:bg-[#050D18] text-slate-900 dark:text-[#F1F5FB] font-sans overflow-hidden print:h-auto print:overflow-visible print:bg-white">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "print:hidden",
        `fixed inset-y-0 left-0 z-50 ${isSpecialtyGuidance ? 'w-[220px]' : 'w-64'} bg-white dark:bg-[#000000] border-r border-[#DCE5EC] dark:border-[#172536] transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0`,
        isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar onClose={() => setIsMobileSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden print:overflow-visible">
        <div className="print:hidden shrink-0"><Header onMenuClick={() => setIsMobileSidebarOpen(true)} /></div>
        <main className={`flex-1 min-w-0 min-h-0 print:overflow-visible print:p-0 ${isSpecialtyGuidance ? 'overflow-y-auto xl:overflow-hidden p-0' : 'overflow-y-auto p-4 md:p-8'}`}>
          {isSpecialtyGuidance ? (
            <Outlet />
          ) : (
            <div className="max-w-7xl xl:max-w-[1520px] mx-auto space-y-6">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
