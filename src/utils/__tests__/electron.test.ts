 /**
  * electron.test.ts
  *
  * Unit tests for the Electron utility helpers in @/utils/electron.
  */
 
import { describe, it, expect, afterEach, vi } from 'vitest';
 import { isElectron, electronTheme } from '../electron';
 
 describe('isElectron', () => {
   const originalElectron = window.electron;
 
   afterEach(() => {
     // Restore original state after each test
     Object.defineProperty(window, 'electron', {
       value: originalElectron,
       writable: true,
       configurable: true,
     });
   });
 
   it('returns false when window.electron is not defined', () => {
     Object.defineProperty(window, 'electron', {
       value: undefined,
       writable: true,
       configurable: true,
     });
     expect(isElectron()).toBe(false);
   });
 
   it('returns true when window.electron is defined', () => {
     Object.defineProperty(window, 'electron', {
       value: {
         theme: {
           getNativeTheme: vi.fn(),
           onThemeChange: vi.fn(),
         },
       },
       writable: true,
       configurable: true,
     });
     expect(isElectron()).toBe(true);
   });
 });
 
 describe('electronTheme', () => {
   const originalElectron = window.electron;
 
   afterEach(() => {
     Object.defineProperty(window, 'electron', {
       value: originalElectron,
       writable: true,
       configurable: true,
     });
   });
 
   it('returns undefined when not in Electron', () => {
     Object.defineProperty(window, 'electron', {
       value: undefined,
       writable: true,
       configurable: true,
     });
     expect(electronTheme()).toBeUndefined();
   });
 
   it('returns the theme bridge when in Electron', () => {
     const mockTheme = {
       getNativeTheme: vi.fn().mockResolvedValue('dark'),
       onThemeChange: vi.fn(),
     };
     Object.defineProperty(window, 'electron', {
       value: { theme: mockTheme },
       writable: true,
       configurable: true,
     });
     expect(electronTheme()).toBe(mockTheme);
   });
 });
