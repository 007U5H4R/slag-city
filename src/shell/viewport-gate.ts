// src/shell/viewport-gate.ts
export const GATE_MAX_WIDTH = 768;
export const shouldGate = (viewportWidth: number): boolean => viewportWidth <= GATE_MAX_WIDTH;

const CARD_HTML = `
  <div class="gate-card" role="status">
    <img class="gate-logo" src="/assets/ui/marquee-small.png" alt="SLAG CITY" width="160" height="48" />
    <h1>This window is too narrow</h1>
    <p>The cabinet needs at least 769px of width for keyboard or gamepad play.</p>
    <p>Widen this window — or open it on a phone, where it plays with touch controls.</p>
  </div>`;

/** Shows the card and hides the cabinet while the viewport is ≤ GATE_MAX_WIDTH. Returns a getter for the current state. */
export function installViewportGate(onChange: (gated: boolean) => void): () => boolean {
  const gate = document.getElementById('gate');
  const room = document.getElementById('room');
  if (!gate || !room) throw new Error('#gate/#room missing');
  gate.innerHTML = CARD_HTML;
  let gated: boolean | null = null;
  const evaluate = (): void => {
    const next = shouldGate(window.innerWidth);
    if (next === gated) return;
    gated = next;
    gate.hidden = !next;
    room.hidden = next;
    onChange(next);
  };
  window.addEventListener('resize', evaluate);
  window.addEventListener('orientationchange', evaluate);
  evaluate();
  return () => gated === true;
}
