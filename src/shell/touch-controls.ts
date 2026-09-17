// src/shell/touch-controls.ts
// On-screen touch controls for mobile play. A DOM overlay (thumb D-pad + action buttons + coin/start) writes
// into a shared, mutable InputFrame; the Phaser TouchSource reads it each frame and folds it into composeInput
// alongside keyboard/gamepad. Lives in the shell (it owns the DOM) so the Phaser adapter stays thin and core
// stays pure. Markup is authored in index.html (#touch / #rotate) and hidden unless <body class="mobile">.
import type { InputFrame } from '@core/types';
import { EMPTY_INPUT } from '@core/types';

// The live state the TouchSource reads. Mutated in place by the pointer handlers below.
export const touchState: InputFrame = { ...EMPTY_INPUT };

// True when the device is touch-primary (a phone/tablet), so main.ts can pick the mobile layout + skip the gate.
export function isTouchDevice(): boolean {
  try {
    return window.matchMedia('(pointer: coarse)').matches
      || 'ontouchstart' in window
      || navigator.maxTouchPoints > 0;
  } catch { return false; }
}

const DPAD_DEADZONE = 14; // px from pad centre before a direction registers (allows a resting thumb + diagonals)

// Wire the overlay's buttons and thumb-pad to `touchState`. Safe to call once at boot on a touch device.
export function installTouchControls(): void {
  const root = document.getElementById('touch');
  if (!root) return; // overlay markup absent → nothing to wire (non-mobile builds/tests)

  // Simple press buttons: pressed while a pointer is down on them. Pointer capture keeps the release ours even
  // if the thumb slides off. preventDefault stops the synthetic mouse event + any scroll/zoom gesture.
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('[data-touch]'))) {
    const key = el.dataset.touch as keyof InputFrame | undefined;
    if (!key || el.id === 'dpad') continue;
    const set = (v: boolean) => { touchState[key] = v; el.classList.toggle('pressed', v); };
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch { /* capture is best-effort */ } set(true); });
    const release = (e: PointerEvent) => { e.preventDefault(); set(false); };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('lostpointercapture', () => set(false));
  }

  // Thumb D-pad: an 8-way analog-ish zone. The active pointer's offset from the pad centre sets the direction
  // booleans (both axes → diagonals). Centre is sampled at press time so it works wherever the pad sits.
  const pad = document.getElementById('dpad');
  if (pad) {
    let activeId: number | null = null;
    let cx = 0, cy = 0;
    const clearDirs = () => { touchState.left = touchState.right = touchState.up = touchState.down = false; pad.classList.remove('pressed'); };
    const apply = (x: number, y: number) => {
      const dx = x - cx, dy = y - cy;
      touchState.left = dx < -DPAD_DEADZONE; touchState.right = dx > DPAD_DEADZONE;
      touchState.up = dy < -DPAD_DEADZONE; touchState.down = dy > DPAD_DEADZONE;
    };
    pad.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const r = pad.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2;
      activeId = e.pointerId; pad.setPointerCapture(e.pointerId); pad.classList.add('pressed'); apply(e.clientX, e.clientY);
    });
    pad.addEventListener('pointermove', (e) => { if (e.pointerId === activeId) { e.preventDefault(); apply(e.clientX, e.clientY); } });
    const end = (e: PointerEvent) => { if (e.pointerId === activeId) { e.preventDefault(); activeId = null; clearDirs(); } };
    pad.addEventListener('pointerup', end);
    pad.addEventListener('pointercancel', end);
    pad.addEventListener('lostpointercapture', () => { activeId = null; clearDirs(); });
  }
}
