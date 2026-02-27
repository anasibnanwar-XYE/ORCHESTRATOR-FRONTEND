import React, { useState, useEffect } from 'react';

interface ResponsiveSidebarProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  position?: 'left' | 'right';
  className?: string;
}

/**
 * Responsive sidebar that transforms into a mobile drawer
 * On mobile: Overlay drawer
 * On desktop: Fixed sidebar
 */
export const ResponsiveSidebar: React.FC<ResponsiveSidebarProps> = ({
  children,
  isOpen,
  onClose,
  position = 'left',
  className = '',
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile: Drawer with overlay
  if (isMobile) {
    return (
      <>
        {/* Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}

        {/* Drawer */}
        <aside
          className={`
            fixed top-0 ${position === 'left' ? 'left-0' : 'right-0'}
            h-full w-64 sm:w-80
            bg-white dark:bg-[#121214]
            shadow-xl dark:shadow-2xl z-50
            backdrop-blur-sm bg-white/95 dark:bg-[#121214]/95
            transform transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : position === 'left' ? '-translate-x-full' : 'translate-x-full'}
            lg:hidden
            ${className}
          `}
        >
          {children}
        </aside>
      </>
    );
  }

  // Desktop: Fixed sidebar
  return (
    <aside
      className={`
        fixed top-0 ${position === 'left' ? 'left-0' : 'right-0'}
        h-full w-64
        bg-white dark:bg-[#121214]
        border-r border-zinc-200 dark:border-zinc-800
        shadow-sm dark:shadow-md
        z-30
        transition-colors duration-200
        ${className}
      `}
    >
      {children}
    </aside>
  );
};

