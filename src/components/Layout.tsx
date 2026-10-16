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
    <div className="flex h-screen bg-[#F7F9FB] dark:bg-[#040D1A] text-slate-900 dark:text-[#FFFFFF] font-sans overflow-hidden print:h-auto print:overflow-visible print:bg-white transition-colors duration-150">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        data-sidebar-container="true"
        className={cn(
          "print:hidden",
          "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#000000] border-r border-[#DCE5EC] dark:border-[#0D1C2E] transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 shadow-lg md:shadow-none",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar onClose={() => setIsMobileSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible bg-[#F7F9FB] dark:bg-[#040D1A]">
        <div className="print:hidden"><Header onMenuClick={() => setIsMobileSidebarOpen(true)} /></div>
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 print:overflow-visible print:p-0 bg-[#F7F9FB] dark:bg-[#040D1A] transition-colors duration-150">
          <div className="max-w-7xl xl:max-w-[1520px] mx-auto space-y-6">
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
