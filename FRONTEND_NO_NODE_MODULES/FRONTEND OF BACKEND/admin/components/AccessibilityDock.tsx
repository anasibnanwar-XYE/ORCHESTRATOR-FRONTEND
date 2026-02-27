import { Fragment, useEffect, useRef, useState } from 'react';
import { SlidersHorizontal, Moon, Sun, EyeOff, X, Monitor, ChevronRight, ChevronLeft, Settings2 } from 'lucide-react';
import { Transition } from '@headlessui/react';
import clsx from 'clsx';

interface AccessibilityDockProps {
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
  brightness: number;
  onBrightnessChange: (value: number) => void;
  onDisable: () => void;
}

export default function AccessibilityDock({
  theme,
  onThemeChange,
  brightness,
  onBrightnessChange,
  onDisable,
}: AccessibilityDockProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const dragStart = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  const dockRef = useRef<HTMLDivElement>(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reposition logic based on device
  const repositionToEdge = () => {
    if (typeof window === 'undefined') return;
    const isMobileCheck = window.innerWidth < 768;
    
    if (isMobileCheck) {
      // On mobile, dock to bottom right by default
      const buttonSize = 48;
      const margin = 16;
      setPosition({
        x: window.innerWidth - buttonSize - margin,
        y: window.innerHeight - buttonSize - margin,
      });
    } else {
      // On desktop, snap to right edge, vertical center
      setPosition({
        x: window.innerWidth,
        y: window.innerHeight / 2,
      });
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      repositionToEdge();
      setIsInitialized(true);
    }
  }, [isInitialized, isMobile]);

  useEffect(() => {
    const handleResize = () => repositionToEdge();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const snapToEdge = (currentX: number, currentY: number) => {
    if (typeof window === 'undefined') return { x: 0, y: currentY };
    
    if (isMobile) {
      // Floating snapping for mobile
      const margin = 16;
      const buttonSize = 48;
      const maxY = window.innerHeight - buttonSize - margin;
      const safeY = Math.min(Math.max(margin, currentY), maxY);
      const midX = window.innerWidth / 2;
      const safeX = currentX + buttonSize / 2 < midX ? margin : window.innerWidth - buttonSize - margin;
      return { x: safeX, y: safeY };
    } else {
      // Right edge snapping for desktop
      const margin = 24;
      const panelHeight = 320; 
      const maxY = window.innerHeight - (panelHeight / 2) - margin;
      const minY = (panelHeight / 2) + margin;
      const safeY = Math.min(Math.max(minY, currentY), maxY);
      return { x: window.innerWidth, y: safeY };
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      e.preventDefault();
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      
      if (isMobile) {
        setPosition({
          x: startPos.current.x + dx,
          y: startPos.current.y + dy,
        });
      } else {
        setPosition({
          x: window.innerWidth,
          y: startPos.current.y + dy,
        });
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      setIsDragging(false);
      
      const moveDist = isMobile 
        ? Math.hypot(e.clientX - dragStart.current.x, e.clientY - dragStart.current.y)
        : Math.abs(e.clientY - dragStart.current.y);

      if (moveDist < 5) {
        setIsOpen((prev) => !prev);
      } else {
        const snapped = snapToEdge(
          startPos.current.x + (e.clientX - dragStart.current.x), 
          startPos.current.y + (e.clientY - dragStart.current.y)
        );
        setPosition(snapped);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, isMobile]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    startPos.current = { ...position };
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && dockRef.current && !dockRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!isInitialized) return null;

  // For mobile menu positioning
  const isRightSide = position.x > window.innerWidth / 2;
  const isBottomSide = position.y > window.innerHeight / 2;
  const mobileMenuOriginClass = clsx(
    isRightSide ? 'right-0 mr-14' : 'left-0 ml-14',
    isBottomSide ? 'bottom-0' : 'top-0'
  );

  return (
    <div 
      ref={dockRef}
      className={clsx(
        "fixed z-[100]",
        !isMobile && "right-0 flex items-center"
      )}
      style={{ 
        left: isMobile ? position.x : undefined,
        top: position.y,
        transform: !isMobile ? 'translateY(-50%)' : undefined,
        touchAction: 'none' 
      }}
    >
      <div className={clsx("relative flex items-center", isMobile && "w-12 h-12")}>
        {/* The Panel */}
        <Transition
          show={isOpen}
          as={Fragment}
          enter={isMobile ? "transition ease-out duration-200" : "transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1)"}
          enterFrom={isMobile ? "opacity-0 scale-90 blur-sm" : "translate-x-full"}
          enterTo={isMobile ? "opacity-100 scale-100 blur-0" : "translate-x-0"}
          leave={isMobile ? "transition ease-in duration-150" : "transition-transform duration-200 cubic-bezier(0.4, 0, 0.2, 1)"}
          leaveFrom={isMobile ? "opacity-100 scale-100 blur-0" : "translate-x-0"}
          leaveTo={isMobile ? "opacity-0 scale-90 blur-sm" : "translate-x-full"}
        >
          <div className={clsx(
            "absolute flex flex-col overflow-hidden shadow-2xl transition-colors",
            isMobile 
              ? `w-64 rounded-2xl border ${mobileMenuOriginClass}`
              : "right-0 mr-12 w-80 rounded-l-xl rounded-r-none border border-r-0",
            theme === 'dark' 
              ? "bg-zinc-950 border-zinc-800" 
              : "bg-white border-zinc-200"
          )}>
            {/* Header */}
            <div className={clsx(
              "flex items-center justify-between border-b px-4 py-3 sm:px-5 sm:py-4",
              theme === 'dark' ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-100 bg-zinc-50"
            )}>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className={clsx("h-4 w-4", theme === 'dark' ? "text-brand-400" : "text-brand-600")} />
                <span className={clsx(
                  "font-display text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em]",
                  theme === 'dark' ? "text-zinc-100" : "text-zinc-900"
                )}>
                  Display Settings
                </span>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className={clsx(
                  "rounded-md p-1 transition-colors",
                  theme === 'dark' ? "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300" : "text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
                )}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-5 sm:gap-6 p-4 sm:p-5">
              {/* Theme Toggle */}
              <div className="space-y-3">
                <label className={clsx(
                  "text-[10px] font-semibold uppercase tracking-[0.15em]",
                  theme === 'dark' ? "text-zinc-500" : "text-zinc-500"
                )}>
                  Appearance
                </label>
                <div className={clsx(
                  "flex rounded-lg border p-1",
                  theme === 'dark' ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-200 bg-zinc-100/50"
                )}>
                  <button
                    onClick={() => onThemeChange('light')}
                    className={clsx(
                      "flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-xs font-medium transition-all",
                      theme === 'light'
                        ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-900/5"
                        : "text-zinc-500 hover:text-zinc-700"
                    )}
                  >
                    <Sun className="h-4 w-4" />
                    Light
                  </button>
                  <button
                    onClick={() => onThemeChange('dark')}
                    className={clsx(
                      "flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-xs font-medium transition-all",
                      theme === 'dark'
                        ? "bg-zinc-800 text-zinc-100 shadow-sm ring-1 ring-white/10"
                        : "text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                  </button>
                </div>
              </div>

              {/* Brightness Control */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className={clsx(
                    "flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em]",
                    theme === 'dark' ? "text-zinc-500" : "text-zinc-500"
                  )}>
                    <Monitor className="h-3 w-3" />
                    Brightness
                  </label>
                  <span className={clsx(
                    "font-mono text-[10px] font-medium",
                    theme === 'dark' ? "text-brand-400" : "text-brand-600"
                  )}>
                    {Math.round(brightness * 100)}%
                  </span>
                </div>
                <div className="relative py-2">
                  <div className={clsx(
                    "absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 rounded-full",
                    theme === 'dark' ? "bg-zinc-800" : "bg-zinc-200"
                  )} />
                  <div 
                    className={clsx(
                      "absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full transition-all duration-75",
                      theme === 'dark' ? "bg-brand-500" : "bg-brand-600"
                    )} 
                    style={{ width: `${((brightness - 0.5) / 1) * 100}%` }}
                  />
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={brightness}
                    onChange={(e) => onBrightnessChange(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full appearance-none bg-transparent opacity-0 cursor-ew-resize"
                  />
                  <div 
                    className={clsx(
                      "pointer-events-none absolute top-1/2 h-3 w-1 -translate-x-1/2 -translate-y-1/2 rounded-sm border shadow-sm transition-all duration-75",
                      theme === 'dark' ? "border-brand-400 bg-zinc-900" : "border-brand-600 bg-white"
                    )}
                    style={{ left: `${((brightness - 0.5) / 1) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={clsx(
              "border-t p-2",
              theme === 'dark' ? "border-zinc-800/50 bg-zinc-900/30" : "border-zinc-100 bg-zinc-50/50"
            )}>
              <button
                onClick={onDisable}
                className={clsx(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors",
                  theme === 'dark' 
                    ? "text-zinc-400 hover:bg-zinc-800/50 hover:text-rose-400" 
                    : "text-zinc-500 hover:bg-zinc-200/50 hover:text-rose-600"
                )}
              >
                <span className="flex items-center gap-2">
                  <EyeOff className="h-3.5 w-3.5" />
                  Hide Controls
                </span>
                <ChevronRight className="h-3.5 w-3.5 opacity-50" />
              </button>
            </div>
          </div>
        </Transition>

        {/* The Trigger */}
        {isMobile ? (
          <button
            onPointerDown={handlePointerDown}
            className={clsx(
              "flex items-center justify-center rounded-full shadow-lg backdrop-blur-xl transition-all duration-300 active:scale-95 outline-none h-12 w-12",
              theme === 'dark' 
                ? "bg-zinc-900/90 text-zinc-300 border border-zinc-700" 
                : "bg-white/90 text-zinc-600 border border-zinc-200",
              isDragging ? "cursor-grabbing scale-105" : "cursor-grab",
              isOpen && "ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-zinc-950"
            )}
            aria-label="Display Settings"
          >
            <Settings2 className={clsx("transition-transform duration-500 h-5 w-5", isOpen && "rotate-90")} />
          </button>
        ) : (
          <button
            onPointerDown={handlePointerDown}
            className={clsx(
              "relative z-10 flex flex-col items-center justify-center border-l border-y shadow-lg backdrop-blur-md transition-all",
              "active:bg-opacity-80 active:scale-[0.98]",
              isDragging ? "cursor-grabbing" : "cursor-grab",
              isOpen ? "translate-x-full opacity-0 pointer-events-none" : "translate-x-0 opacity-100",
              theme === 'dark' 
                ? "bg-zinc-900/90 border-zinc-700 text-zinc-400 hover:text-brand-400 hover:bg-zinc-800" 
                : "bg-white/90 border-zinc-300 text-zinc-500 hover:text-brand-600 hover:bg-zinc-50",
              "h-20 w-10 rounded-l-xl"
            )}
            aria-label="Toggle Display Settings"
          >
            {/* Grip lines indicating it's draggable */}
            <div className="absolute left-1.5 flex flex-col gap-1 opacity-30">
              <div className={clsx("h-1 w-0.5 rounded-full", theme === 'dark' ? "bg-white" : "bg-black")} />
              <div className={clsx("h-1 w-0.5 rounded-full", theme === 'dark' ? "bg-white" : "bg-black")} />
              <div className={clsx("h-1 w-0.5 rounded-full", theme === 'dark' ? "bg-white" : "bg-black")} />
            </div>
            <ChevronLeft className="ml-1 h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}