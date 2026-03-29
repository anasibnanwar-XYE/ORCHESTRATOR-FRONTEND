 /**
  * Mobile utility helpers for Orchestrator ERP.
  *
  * Provides mobile-safe implementations for:
  *   - PDF/blob downloads (iOS Safari doesn't support the `download` attribute)
  *   - Touch target validation helpers
  *   - Mobile detection
  */
 
 /**
  * Detects if the user is on iOS (iPhone / iPad).
  * Uses User-Agent matching — sufficient for download behaviour branching.
  */
 export function isIOS(): boolean {
   if (typeof navigator === 'undefined') return false;
   return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
 }
 
 /**
  * Detects if the current device is likely a mobile/touch device
  * (screen width ≤ 640px or touch input available).
  */
 export function isMobileDevice(): boolean {
   if (typeof window === 'undefined') return false;
   return window.matchMedia('(max-width: 639px)').matches || 'ontouchstart' in window;
 }
 
 /**
  * Downloads a blob as a file.
  *
  * On iOS, the `<a download>` trick does not work in Safari — the browser
  * ignores the `download` attribute for blob: URLs. Instead we open the blob
  * in a new tab so the user can long-press → "Save to Files" or "Save Image".
  *
  * On all other browsers we use the standard anchor-click approach which
  * triggers the Save dialog immediately.
  *
  * @param blob     The file content
  * @param filename Suggested filename (used on non-iOS browsers)
  */
 export function downloadBlob(blob: Blob, filename: string): void {
   const url = URL.createObjectURL(blob);
 
   try {
     if (isIOS()) {
       // iOS Safari: open in new tab — user can then long-press → save
       window.open(url, '_blank');
       // Revoke after a short delay to ensure the new tab has loaded the URL
       setTimeout(() => URL.revokeObjectURL(url), 10_000);
     } else {
       const link = document.createElement('a');
       link.href = url;
       link.download = filename;
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
       URL.revokeObjectURL(url);
     }
   } catch {
     // Fallback: always open in new tab
     window.open(url, '_blank');
     setTimeout(() => URL.revokeObjectURL(url), 10_000);
   }
 }
