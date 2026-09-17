// src/shell/service-screen.ts
let retryHandler: (() => void) | null = null;
let listening = false;

export function showService(assetId: string, retry: () => void): void {
  const el = document.getElementById('service');
  if (!el) throw new Error('#service missing');
  retryHandler = retry;
  el.innerHTML = `
    <pre class="service-text">SERVICE MODE

ASSET LOAD ERROR
  ID: ${escapeHtml(assetId)}

PRESS R, GAMEPAD START — OR TAP THE SCREEN — TO RETRY
TIP: THE C KEY TOGGLES THE CRT PASS IF THE PICTURE IS TOO INTENSE
${import.meta.env.DEV ? '\n(dev) see console for the failing URL' : ''}</pre>`;
  el.hidden = false;
  if (!listening) {
    listening = true;
    window.addEventListener('keydown', (ev) => { if (ev.key === 'r' || ev.key === 'R') triggerRetry(); });
    el.addEventListener('pointerdown', () => triggerRetry()); // phones reach this screen now and have no R key
    const poll = (): void => {
      if (!el.hidden) for (const g of navigator.getGamepads?.() ?? []) if (g?.buttons[9]?.pressed) { triggerRetry(); break; }
      requestAnimationFrame(poll);
    };
    requestAnimationFrame(poll);
  }
}
export function hideService(): void {
  const el = document.getElementById('service');
  if (el) { el.hidden = true; el.innerHTML = ''; }
  retryHandler = null;
}
function triggerRetry(): void { const h = retryHandler; if (h) { hideService(); h(); } }
function escapeHtml(s: string): string { return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)); }
