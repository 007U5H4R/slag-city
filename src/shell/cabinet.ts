const MARQUEE_H = 120;   // CSS px reserved above the screen
const PANEL_H = 56;      // CSS px control-panel suggestion below the screen
export const BEZEL_PAD = 24; // CSS px of bezel frame around the screen on each side

export function installCabinet(): { chromeHeight(): number; compactChromeHeight(): number; setCompact(on: boolean): void } {
  const root = document.documentElement;
  root.style.setProperty('--marquee-h', `${MARQUEE_H}px`);
  root.style.setProperty('--panel-h', `${PANEL_H}px`);
  const marquee = document.getElementById('marquee');
  const cabinet = document.getElementById('cabinet');
  if (!marquee || !cabinet) throw new Error('#marquee/#cabinet missing');
  const img = document.createElement('img');
  img.src = '/assets/ui/marquee.png';
  img.alt = '';
  img.decoding = 'async';
  marquee.replaceChildren(img);
  const panel = document.createElement('div');
  panel.id = 'panel';
  panel.setAttribute('aria-hidden', 'true');
  cabinet.appendChild(panel);
  return {
    chromeHeight: () => MARQUEE_H + PANEL_H + 2 * BEZEL_PAD,
    compactChromeHeight: () => 2 * BEZEL_PAD,
    // Compact = bezel only: the marquee and panel strip are dropped so the game can render a scale step larger.
    setCompact: (on) => {
      document.body.classList.toggle('compact', on);
      root.style.setProperty('--marquee-h', on ? '0px' : `${MARQUEE_H}px`);
      root.style.setProperty('--panel-h', on ? '0px' : `${PANEL_H}px`);
    },
  };
}
