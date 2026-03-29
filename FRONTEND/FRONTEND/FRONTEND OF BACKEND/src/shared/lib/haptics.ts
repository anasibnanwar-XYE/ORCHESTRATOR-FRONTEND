/**
 * Cross-platform haptic feedback
 * - Mobile: Navigator.vibrate() API (Android Chrome, some iOS Safari)
 * - Desktop: Subtle scale animation + optional AudioContext click
 * - Electron: ipcRenderer if available
 */

type HapticIntensity = 'light' | 'medium' | 'heavy';

const VIBRATION_PATTERNS: Record<HapticIntensity, number | number[]> = {
  light: 8,
  medium: 15,
  heavy: [10, 30, 20],
};

let audioCtx: AudioContext | null = null;

function playClickSound(intensity: HapticIntensity) {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const freq = intensity === 'light' ? 1800 : intensity === 'medium' ? 1200 : 600;
    const vol = intensity === 'light' ? 0.015 : intensity === 'medium' ? 0.025 : 0.035;
    const dur = intensity === 'light' ? 0.02 : intensity === 'medium' ? 0.03 : 0.04;

    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = vol;
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);

    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  } catch {
    // AudioContext not available
  }
}

function triggerVisualFeedback(intensity: HapticIntensity) {
  if (typeof document === 'undefined') return;
  const el = document.activeElement as HTMLElement | null;
  if (!el) return;

  const scale = intensity === 'light' ? '0.985' : intensity === 'medium' ? '0.975' : '0.96';
  const dur = intensity === 'light' ? '80' : intensity === 'medium' ? '100' : '120';

  el.style.transition = `transform ${dur}ms cubic-bezier(0.22, 1, 0.36, 1)`;
  el.style.transform = `scale(${scale})`;
  requestAnimationFrame(() => {
    setTimeout(() => {
      el.style.transform = '';
    }, parseInt(dur));
  });
}

export function haptic(intensity: HapticIntensity = 'light') {
  // 1. Try native vibration (mobile browsers)
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(VIBRATION_PATTERNS[intensity]);
    } catch {
      // vibrate not supported
    }
  }

  // 2. Try Electron haptics
  if (typeof window !== 'undefined' && (window as any).electron?.haptic) {
    try {
      (window as any).electron.haptic(intensity);
      return;
    } catch {
      // Not Electron
    }
  }

  // 3. Desktop: subtle audio tick + visual feedback
  playClickSound(intensity);
  triggerVisualFeedback(intensity);
}

export function hapticSuccess() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([10, 50, 10, 50, 15]);
  }
  playClickSound('medium');
}

export function hapticError() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([30, 50, 30, 50, 30]);
  }
  playClickSound('heavy');
}

export function hapticNotification() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([5, 100, 10]);
  }
  playClickSound('light');
}
