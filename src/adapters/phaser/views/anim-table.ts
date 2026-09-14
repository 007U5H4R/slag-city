// src/adapters/phaser/views/anim-table.ts
import type { Entity, EntityKind } from '@core/sim/entity';

export interface AnimSpec { atlas: string; action: string; fps: number; loop: boolean }

// Gang enemies (brawler/knife/heavy) each ship a walk (4) + attack (4) atlas. Their FSM states
// (idle/ring/approach/<attackMove>/hurt/knockdown/down/getup/dead) map onto those two actions the same
// way the hero's extra states fall back to walk/attack until dedicated sheets exist (ticket 12): the
// attack move plays the attack sheet (non-looping, spread over the move length), everything else uses
// walk (moving states loop at 10fps; static states hold frame 0). `attackMove` is the kind's GANG_DATA
// attackMove name (brawler 'punch', knife 'stab', heavy 'slam'); `atlas` is the BootScene atlas key.
function gangAnims(atlas: string, attackMove: string): Record<string, AnimSpec> {
  const walk = (fps: number): AnimSpec => ({ atlas, action: 'walk', fps, loop: true });
  return {
    idle: walk(0), ring: walk(10), approach: walk(10),
    [attackMove]: { atlas, action: 'attack', fps: 0, loop: false },
    hurt: walk(0), knockdown: walk(0), down: walk(0), getup: walk(0), dead: walk(0),
  };
}

// Base hero entries + the full M0 hero state set. Maps every hero state onto the M0 atlas actions
// (walk/attack) as a box/sprite fallback; ticket 12 swaps in dedicated action sheets. Created here in
// ticket 7.4 (self-contained data — no art dependency); ticket 03 provides the hero atlas art and wires
// EntityViews to read this table (and adds non-hero kinds).
export const ANIM_TABLE: Partial<Record<EntityKind, Record<string, AnimSpec>>> = {
  hero: {
    idle: { atlas: 'hero', action: 'idle', fps: 0, loop: true },      // dedicated idle sheet (scaling pass); ticket 12 may add a breathing loop
    walk: { atlas: 'hero', action: 'walk', fps: 10, loop: true },
    attack1: { atlas: 'hero', action: 'attack', fps: 0, loop: false },
    attack2: { atlas: 'hero', action: 'attack', fps: 0, loop: false },
    attack3: { atlas: 'hero', action: 'attack', fps: 0, loop: false },
    jump: { atlas: 'hero', action: 'walk', fps: 0, loop: true },
    jumpAttack: { atlas: 'hero', action: 'attack', fps: 0, loop: false },
    grab: { atlas: 'hero', action: 'walk', fps: 0, loop: true },
    throw: { atlas: 'hero', action: 'attack', fps: 0, loop: false },
    special: { atlas: 'hero', action: 'attack', fps: 0, loop: false },
    hurt: { atlas: 'hero', action: 'hurt', fps: 0, loop: true },
    knockdown: { atlas: 'hero', action: 'walk', fps: 0, loop: true },
    down: { atlas: 'hero', action: 'walk', fps: 0, loop: true },
    getup: { atlas: 'hero', action: 'walk', fps: 0, loop: true },
    dead: { atlas: 'hero', action: 'walk', fps: 0, loop: true },
  },
  brawler: gangAnims('brawler', 'punch'),
  knife: gangAnims('knife', 'stab'),
  heavy: gangAnims('heavy', 'slam'),
  // Feral machine — every FSM state mapped now (the 'feral' atlas arrives in a later art pass, so boxes
  // render via EntityView's fallback until then; pounce is one-shot, the rest loop/hold).
  feral: {
    emerge: { atlas: 'feral', action: 'emerge', fps: 8, loop: true },
    idle: { atlas: 'feral', action: 'idle', fps: 0, loop: true },
    stalk: { atlas: 'feral', action: 'move', fps: 8, loop: true },
    pounce: { atlas: 'feral', action: 'pounce', fps: 8, loop: false },
    hurt: { atlas: 'feral', action: 'hurt', fps: 0, loop: true },
    knockdown: { atlas: 'feral', action: 'knockdown', fps: 0, loop: true },
    down: { atlas: 'feral', action: 'down', fps: 0, loop: true },
    getup: { atlas: 'feral', action: 'getup', fps: 0, loop: true },
    dead: { atlas: 'feral', action: 'dead', fps: 0, loop: true },
  },
  // The dropped arm-cannon pickup — static; box renders until an item atlas exists.
  weaponPickup: { idle: { atlas: 'weaponPickup', action: 'idle', fps: 0, loop: true } },
};

export function animFor(e: Entity): AnimSpec | null { return ANIM_TABLE[e.kind]?.[e.state] ?? null; }

// Palette-swap variant hook. VARIANT_TINT strokes box views so variants are visible; variantAtlasKey is
// exported for ticket 03's sprite pipeline to resolve variant textures (base for 0, `${base}-v${variant}`
// otherwise) with a fallback to the base atlas — nothing calls variantAtlasKey yet, which is expected.
export const VARIANT_TINT = [0xffffff, 0xffd0d0, 0xd0ffd0, 0xd0d0ff] as const;
export const variantAtlasKey = (base: string, variant: number): string => (variant === 0 ? base : `${base}-v${variant}`);

/** Looping: advance by fps at 60Hz. Non-looping: spread the frames over the move's total length. */
export function frameIndexFor(e: Entity, frameCount: number, spec: AnimSpec, totalFrames?: number): number {
  if (frameCount <= 1) return 0;
  if (spec.loop) return spec.fps === 0 ? 0 : Math.floor(e.stateFrame * spec.fps / 60) % frameCount;
  const total = totalFrames ?? frameCount;
  return Math.min(frameCount - 1, Math.floor((Math.max(0, e.stateFrame - 1) / total) * frameCount));
}
