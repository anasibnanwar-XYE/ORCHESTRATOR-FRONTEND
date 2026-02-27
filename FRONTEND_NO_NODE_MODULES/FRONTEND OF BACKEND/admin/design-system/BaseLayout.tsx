import React, { useState } from 'react';
import { ResponsiveHeader, ResponsiveSidebar } from './index';

interface BaseLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  headerTitle?: string;
  headerLogo?: React.ReactNode;
  headerActions?: React.ReactNode;
  sidebarPosition?: 'left' | 'right';
}

/**
 * Base responsive layout component
 * Provides consistent structure across all pages
 * Mobile: Sidebar becomes drawer, header has menu button
 * Desktop: Fixed sidebar, full header
 */
export const BaseLayout: React.FC<BaseLayoutProps> = ({
  children,
  sidebar,
  headerTitle,
  headerLogo,
  headerActions,
  sidebarPosition = 'left',
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <ResponsiveHeader
        title={headerTitle}
        logo={headerLogo}
        actions={headerActions}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex">
        {/* Sidebar */}
        {sidebar && (
          <ResponsiveSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            position={sidebarPosition}
          >
            {sidebar}
          </ResponsiveSidebar>
        )}

        {/* Main Content */}
        <main
          className={`
            flex-1
            ${sidebar ? 'lg:ml-64' : ''}
            transition-all duration-300
            min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)]
          `}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

