// src/shell/touch-controls.ts
// On-screen touch controls for mobile play. A DOM overlay (thumb D-pad + action buttons + coin/start) writes
// into a shared, mutable InputFrame; the Phaser TouchSource reads it each frame and folds it into composeInput
// alongside keyboard/gamepad. Lives in the shell (it owns the DOM) so the Phaser adapter stays thin and core
// stays pure. Markup is authored in index.html (#touch / #rotate) and hidden unless <body class="mobile">.
import type { InputFrame } from '@core/types';
import { EMPTY_INPUT } from '@core/types';

// The live state the TouchSource reads. Mutated in place by the pointer handlers below.
export const touchState: InputFrame = { ...EMPTY_INPUT };

// True when the device is touch-PRIMARY (a phone/tablet), so main.ts can pick the mobile layout + skip the gate.
// Deliberately NOT `'ontouchstart' in window` / `maxTouchPoints > 0`: those are also true on touchscreen laptops
// (Surface, Chromebook) that are driven by keyboard + mouse, which would lose the cabinet and get the overlay.
// `(pointer: coarse)` is the primary-input query: coarse = finger, fine = mouse/trackpad.
export function isTouchDevice(): boolean {
  try { return window.matchMedia('(pointer: coarse)').matches; } catch { return false; }
}

const DPAD_DEADZONE = 14; // px from pad centre before a direction registers (allows a resting thumb + diagonals)

// Every control currently held, keyed by the pointer holding it → how to let go. The window-level backstops use
// this so a press can never get stuck "down" (auto-attacking, or silently hold-skipping the next story screen).
const held = new Map<number, () => void>();
const releasePointer = (id: number): void => { const r = held.get(id); if (r) { held.delete(id); r(); } };
export function releaseAllTouch(): void { for (const id of Array.from(held.keys())) releasePointer(id); }

// Wire the overlay's buttons and thumb-pad to `touchState`. Safe to call once at boot on a touch device.
export function installTouchControls(): void {
  const root = document.getElementById('touch');
  if (!root) return; // overlay markup absent → nothing to wire (non-mobile builds/tests)
  const capture = (el: HTMLElement, id: number): void => { try { el.setPointerCapture(id); } catch { /* best-effort; the window backstop covers a failed capture */ } };

  // Simple press buttons: pressed while a pointer is down on them. preventDefault stops the synthetic mouse event
  // + any scroll/zoom gesture.
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('[data-touch]'))) {
    const key = el.dataset.touch as keyof InputFrame | undefined;
    if (!key || el.id === 'dpad') continue;
    const set = (v: boolean): void => { touchState[key] = v; el.classList.toggle('pressed', v); };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault(); capture(el, e.pointerId);
      held.set(e.pointerId, () => set(false)); set(true);
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
      el.addEventListener(type, (e) => { if (type !== 'lostpointercapture') e.preventDefault(); releasePointer(e.pointerId); });
    }
  }

  // Thumb D-pad: an 8-way analog-ish zone. The active pointer's offset from the pad centre sets the direction
  // booleans (both axes → diagonals). Centre is sampled at press time so it works wherever the pad sits. Only
  // ONE pointer drives it: a second finger on the pad is ignored, and only the driving pointer can release it.
  const pad = document.getElementById('dpad');
  if (pad) {
    let activeId: number | null = null;
    let cx = 0, cy = 0;
    const clearDirs = (): void => { activeId = null; touchState.left = touchState.right = touchState.up = touchState.down = false; pad.classList.remove('pressed'); };
    const apply = (x: number, y: number): void => {
      const dx = x - cx, dy = y - cy;
      touchState.left = dx < -DPAD_DEADZONE; touchState.right = dx > DPAD_DEADZONE;
      touchState.up = dy < -DPAD_DEADZONE; touchState.down = dy > DPAD_DEADZONE;
    };
    pad.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (activeId !== null) return; // a second finger doesn't steal or reset the pad
      const r = pad.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2;
      activeId = e.pointerId; held.set(e.pointerId, clearDirs);
      capture(pad, e.pointerId); pad.classList.add('pressed'); apply(e.clientX, e.clientY);
    });
    pad.addEventListener('pointermove', (e) => { if (e.pointerId === activeId) { e.preventDefault(); apply(e.clientX, e.clientY); } });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
      pad.addEventListener(type, (e) => { if (e.pointerId === activeId) releasePointer(e.pointerId); });
    }
  }

  // Backstops: if capture failed and the finger lifted over something else, the control never saw its pointerup.
  window.addEventListener('pointerup', (e) => releasePointer(e.pointerId));
  window.addEventListener('pointercancel', (e) => releasePointer(e.pointerId));
  window.addEventListener('blur', releaseAllTouch);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAllTouch(); });
}
