import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, sidebar }) => {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Fixed width, macOS sidebar style */}
      <aside className="w-80 bg-gray-50/50 backdrop-blur-xl border-r border-gray-200 flex flex-col h-full overflow-y-auto z-10 hidden md:block">
        <div className="p-6 pb-2">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            <span>ScreenFlow</span>
          </div>
        </div>
        <div className="flex-1">
          {sidebar}
        </div>
        <div className="p-4 border-t border-gray-200">
           <div className="text-xs text-gray-400 text-center">
             v1.0.0 • Powered by Gemini
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto bg-white/50 relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        <div className="p-8 md:p-12">
          {children}
        </div>
      </main>
    </div>
  );
};