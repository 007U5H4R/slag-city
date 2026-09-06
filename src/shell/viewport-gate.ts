// src/shell/viewport-gate.ts
export const GATE_MAX_WIDTH = 768;
export const shouldGate = (viewportWidth: number): boolean => viewportWidth <= GATE_MAX_WIDTH;

const CARD_HTML = `
  <div class="gate-card" role="status">
    <img class="gate-logo" src="/assets/ui/marquee-small.png" alt="SLAG CITY" width="160" height="48" />
    <h1>Desktop browser required</h1>
    <p>Keyboard or gamepad only — this cabinet doesn't run on phones.</p>
    <p>Visit on a desktop browser to play.</p>
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
