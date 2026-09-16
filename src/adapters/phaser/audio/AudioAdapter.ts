// src/adapters/phaser/audio/AudioAdapter.ts
// Procedural retro audio (ticket 22): every SFX id is a synthesised blip and every MUSIC id a short chiptune
// loop, played through the Web Audio context Phaser already owns (resumed by the ticket-20 unlock on first
// keypress). No sample assets/licences — the AudioAdapter interface (sfx/music/setVolume/mute) is the seam,
// so licensed OGG packs can back the same ids later without touching callers. Everything is silent-on-failure.
import type Phaser from 'phaser';
import type { SfxId, MusicId } from '@core/arcade/audio-ids';

interface Voice { wave: OscillatorType; f0: number; f1?: number; dur: number; g?: number; noise?: number }

// f0->f1 sweep (f1 defaults to f0); optional layered noise burst (noise = its gain). Kept short + punchy.
const VOICES: Record<string, Voice> = {
  coin: { wave: 'square', f0: 784, f1: 1319, dur: 0.14, g: 0.5 },
  start: { wave: 'square', f0: 523, f1: 1047, dur: 0.22, g: 0.5 },
  hit_light: { wave: 'square', f0: 240, f1: 180, dur: 0.06, g: 0.4 },
  hit_heavy: { wave: 'square', f0: 150, f1: 90, dur: 0.12, g: 0.5, noise: 0.3 },
  hit_launch: { wave: 'sawtooth', f0: 300, f1: 820, dur: 0.18, g: 0.5 },
  knockdown: { wave: 'triangle', f0: 160, f1: 60, dur: 0.2, g: 0.5, noise: 0.4 },
  pickup: { wave: 'triangle', f0: 660, f1: 990, dur: 0.1, g: 0.45 },
  weapon_pickup: { wave: 'square', f0: 523, f1: 784, dur: 0.12, g: 0.45 },
  weapon_drop: { wave: 'square', f0: 420, f1: 200, dur: 0.1, g: 0.4 },
  weapon_break: { wave: 'square', f0: 900, f1: 300, dur: 0.16, g: 0.4, noise: 0.5 },
  namecard: { wave: 'square', f0: 440, f1: 660, dur: 0.16, g: 0.45 },
  continue_tick: { wave: 'square', f0: 880, dur: 0.05, g: 0.4 },
  game_over: { wave: 'sawtooth', f0: 320, f1: 70, dur: 0.7, g: 0.5 },
  hiscore_confirm: { wave: 'square', f0: 784, f1: 1047, dur: 0.12, g: 0.45 },
  crate: { wave: 'triangle', f0: 200, f1: 120, dur: 0.12, g: 0.45, noise: 0.4 },
  grab: { wave: 'square', f0: 300, f1: 260, dur: 0.06, g: 0.4 },
  throw: { wave: 'sawtooth', f0: 500, f1: 950, dur: 0.12, g: 0.4 },
  special: { wave: 'sawtooth', f0: 200, f1: 1200, dur: 0.3, g: 0.5 },
  cannon: { wave: 'sawtooth', f0: 200, f1: 90, dur: 0.15, g: 0.5, noise: 0.4 },
  glob: { wave: 'triangle', f0: 420, f1: 150, dur: 0.18, g: 0.45 },
  sizzle: { wave: 'sawtooth', f0: 1200, f1: 1600, dur: 0.25, g: 0.15, noise: 0.5 },
  lock: { wave: 'square', f0: 200, f1: 150, dur: 0.1, g: 0.5, noise: 0.2 },
  lock_release: { wave: 'square', f0: 400, f1: 720, dur: 0.12, g: 0.45 },
  feral_emerge: { wave: 'sawtooth', f0: 110, f1: 320, dur: 0.3, g: 0.45, noise: 0.2 },
  boss_tear: { wave: 'sawtooth', f0: 240, f1: 60, dur: 0.4, g: 0.55, noise: 0.5 },
  boss_phase2: { wave: 'sawtooth', f0: 100, f1: 440, dur: 0.4, g: 0.55 },
  boss_death: { wave: 'sawtooth', f0: 320, f1: 45, dur: 0.85, g: 0.6, noise: 0.3 },
  ladle: { wave: 'square', f0: 300, f1: 220, dur: 0.2, g: 0.45, noise: 0.3 },
};
const DEFAULT_VOICE: Voice = { wave: 'square', f0: 440, dur: 0.08, g: 0.35 };

// Chiptune loops: one lead line, 8th notes. 0 = rest. Frequencies in Hz.
const A = 220, C = 261.63, D = 293.66, E = 329.63, F = 349.23, G = 392, AA = 440, CC = 523.25, DD = 587.33, EE = 659.25;
const MUSIC: Record<MusicId, { step: number; wave: OscillatorType; notes: number[] }> = {
  title: { step: 260, wave: 'triangle', notes: [A, 0, E, 0, F, 0, E, 0, D, 0, C, 0, D, E, 0, 0] },
  stage: { step: 150, wave: 'square', notes: [A, A, E, A, C, C, E, C, D, D, F, D, E, E, G, E] },
  boss: { step: 120, wave: 'sawtooth', notes: [A, C, A, CC, A, C, AA, C, D, F, D, DD, C, EE, CC, E] },
};

export class AudioAdapter {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private cur: MusicId | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private muted = false;
  private volume: number;

  constructor(scene: Phaser.Scene, volume = 0.6) {
    this.volume = volume;
    const mgr = scene.sound as unknown as { context?: AudioContext };
    const ctx = mgr && typeof mgr.context === 'object' ? mgr.context : null;
    if (!ctx) return; // Canvas fallback / no Web Audio → silent, harmless
    this.ctx = ctx;
    this.master = ctx.createGain(); this.master.gain.value = volume; this.master.connect(ctx.destination);
    this.musicBus = ctx.createGain(); this.musicBus.gain.value = 0.4; this.musicBus.connect(this.master);
  }

  sfx(id: SfxId | string): void {
    if (!this.ctx || !this.master || this.muted) return;
    try { this.play(VOICES[id] ?? DEFAULT_VOICE, this.master); } catch { /* silent */ }
  }

  music(id: MusicId | null): void {
    if (id === this.cur) return;
    this.cur = id;
    if (this.timer !== null) { clearInterval(this.timer); this.timer = null; }
    if (!id || !this.ctx || !this.musicBus) return;
    this.step = 0;
    const track = MUSIC[id];
    const tick = (): void => {
      const f = track.notes[this.step % track.notes.length]!;
      this.step++;
      if (f > 0 && this.musicBus) { try { this.play({ wave: track.wave, f0: f, dur: track.step / 1000 * 0.9, g: 0.5 }, this.musicBus); } catch { /* */ } }
    };
    tick();
    this.timer = setInterval(tick, track.step);
  }

  setVolume(v: number): void { this.volume = Math.max(0, Math.min(1, v)); if (this.master) this.master.gain.value = this.muted ? 0 : this.volume; }
  getVolume(): number { return this.volume; }
  mute(on: boolean): void { this.muted = on; if (this.master) this.master.gain.value = on ? 0 : this.volume; }

  private play(v: Voice, out: GainNode): void {
    const ctx = this.ctx!; const t = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime((v.g ?? 0.4), t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + v.dur);
    gain.connect(out);
    const osc = ctx.createOscillator();
    osc.type = v.wave;
    osc.frequency.setValueAtTime(v.f0, t);
    if (v.f1 && v.f1 !== v.f0) osc.frequency.exponentialRampToValueAtTime(Math.max(1, v.f1), t + v.dur);
    osc.connect(gain); osc.start(t); osc.stop(t + v.dur);
    if (v.noise) {
      const n = Math.floor(ctx.sampleRate * v.dur);
      const buf = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const ng = ctx.createGain(); ng.gain.setValueAtTime(v.noise, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + v.dur); ng.connect(out);
      const src = ctx.createBufferSource(); src.buffer = buf; src.connect(ng); src.start(t); src.stop(t + v.dur);
    }
  }
}
