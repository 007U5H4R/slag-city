// src/core/entities/hero.ts
import type { Facing, InputFrame } from '../types';
import type { Entity } from '../sim/entity';
import { setState, isBody, faction } from '../sim/entity';
import type { WorldState } from '../sim/state';
import { emit, byId } from '../sim/state';
import { HERO_DATA, moveTotal, nextChain, SPECIAL_COST, dataFor, GRAB_BOX, GRAB_TIMEOUT, THROW } from '../combat/frame-data';
import { updateStunState } from '../combat/stun';
import { hitConnects } from '../combat/hit';
import { HIT_FEEL } from '../combat/hit-feel';
import { PICKUP_RADIUS, spawnProjectile } from './items';
import { useWeapon } from '../weapons/heat';

/** True on the frame a button goes from up to down. */
export function pressed(state: WorldState, input: InputFrame, key: keyof InputFrame): boolean {
  return input[key] && !state.prevInput[key];
}

function readAxis(input: InputFrame): { dx: number; dy: number } {
  return { dx: (input.right ? 1 : 0) - (input.left ? 1 : 0), dy: (input.down ? 1 : 0) - (input.up ? 1 : 0) };
}

/** A grabbable enemy: a non-boss gang body currently in hitstun, within the grab box. */
function findGrabbable(state: WorldState, hero: Entity): Entity | undefined {
  return state.entities.find((e) => e.id !== hero.id && isBody(e) && faction(e) === 'gang' && e.kind !== 'boss'
    && e.state === 'hurt' && hitConnects(hero, GRAB_BOX, e, dataFor(e.kind).hurtbox));
}

/** Drop whatever the hero is holding, leaving the enemy briefly stunned. */
export function releaseGrab(state: WorldState, hero: Entity): void {
  const v = byId(state, hero.grabbedId);
  if (v && v.state === 'grabbed') { setState(v, 'hurt'); v.hitstun = 8; }
  hero.grabbedId = null;
}

export function updateHero(state: WorldState, hero: Entity, input: InputFrame): void {
  hero.stateFrame++;
  // Release a held enemy whenever the hero leaves the grab/throw states (e.g. was hit into hurt).
  if (hero.grabbedId !== null && hero.state !== 'grab' && hero.state !== 'throw') releaseGrab(state, hero);
  if (updateStunState(state, hero)) return;
  const { dx, dy } = readAxis(input);
  if (hero.state === 'jumpAttack') {
    if (hero.stateFrame > 1 && hero.pos.z === 0) { hero.vel.x = 0; setState(hero, 'idle'); }
    return;
  }
  if (hero.state === 'grab') {
    hero.vel.x = 0; hero.vel.y = 0;
    const v = byId(state, hero.grabbedId);
    if (!v || v.state !== 'grabbed' || hero.stateFrame >= GRAB_TIMEOUT) { releaseGrab(state, hero); setState(hero, 'idle'); return; }
    if (pressed(state, input, 'attack')) { setState(hero, 'throw'); }
    return;
  }
  if (hero.state === 'throw') {
    hero.vel.x = 0; hero.vel.y = 0;
    const m = HERO_DATA.moves.throw!;
    if (hero.stateFrame === m.startup + 1) {
      const v = byId(state, hero.grabbedId);
      if (v && v.state === 'grabbed') {
        setState(v, 'thrown'); v.hp -= THROW.damage; v.flashFrames = HIT_FEEL.flashFrames;
        v.pos.z = 1; v.vel.z = THROW.vz; v.vel.x = THROW.vx * hero.facing; v.vel.y = 0; v.facing = (hero.facing * -1) as Facing;
        state.hitstop = Math.max(state.hitstop, HIT_FEEL.hitstop.heavy);
        emit(state, { type: 'sfx', id: 'throw' });
      }
      hero.grabbedId = null;
    }
    if (hero.stateFrame >= moveTotal(m)) setState(hero, 'idle');
    return;
  }
  const move = HERO_DATA.moves[hero.state];
  if (move) {
    hero.vel.x = 0; hero.vel.y = 0;
    if (pressed(state, input, 'attack')) hero.chainQueued = true;
    if ((hero.state === 'cannonFire' || hero.state === 'bladeSwing') && hero.stateFrame === move.startup + 1) {
      if (hero.state === 'cannonFire') { spawnProjectile(state, 'cannon', hero.pos.x + hero.facing * 16, hero.pos.y, 28, hero.facing, 'hero'); emit(state, { type: 'sfx', id: 'cannon' }); }
      hero.weaponUsePending = true;
    }
    if (hero.stateFrame >= moveTotal(move)) {
      if (hero.weaponUsePending) { hero.weaponUsePending = false; useWeapon(state, hero); }
      const next = hero.chainQueued ? nextChain('hero', hero.state) : null;
      hero.chainQueued = false;
      setState(hero, next ?? 'idle');
    }
    return;
  }
  switch (hero.state) {
    case 'idle':
    case 'walk': {
      hero.vel.x = dx * HERO_DATA.walkSpeed.x;
      hero.vel.y = dy * HERO_DATA.walkSpeed.y;
      if (dx !== 0) hero.facing = dx > 0 ? 1 : -1;
      const moving = dx !== 0 || dy !== 0;
      if (moving && hero.state !== 'walk') setState(hero, 'walk');
      if (!moving && hero.state !== 'idle') setState(hero, 'idle');
      if (pressed(state, input, 'special') && hero.hp > SPECIAL_COST) {
        hero.hp -= SPECIAL_COST; setState(hero, 'special'); hero.vel.x = 0; hero.vel.y = 0;
        hero.invulnFrames = HERO_DATA.moves.special!.startup + HERO_DATA.moves.special!.active;
        emit(state, { type: 'sfx', id: 'special' });
        break;
      }
      if (dx !== 0) {
        const g = findGrabbable(state, hero);
        if (g) { setState(hero, 'grab'); hero.grabbedId = g.id; setState(g, 'grabbed'); g.hitstun = 0; hero.vel.x = 0; hero.vel.y = 0; emit(state, { type: 'sfx', id: 'grab' }); break; }
      }
      if (pressed(state, input, 'attack')) {
        const over = state.entities.find((p) => p.kind === 'weaponPickup' && Math.abs(p.pos.x - hero.pos.x) <= PICKUP_RADIUS.x && Math.abs(p.pos.y - hero.pos.y) <= PICKUP_RADIUS.y);
        if (over && over.weapon && !hero.weapon) {
          hero.weapon = { ...over.weapon }; over.dead = true;
          emit(state, { type: 'pickup', kind: over.weapon.kind, x: over.pos.x, y: over.pos.y }); emit(state, { type: 'sfx', id: 'weapon_pickup' });
          break;
        }
        setState(hero, hero.weapon ? (hero.weapon.kind === 'blade' ? 'bladeSwing' : 'cannonFire') : 'attack1');
        hero.chainQueued = false; hero.vel.x = 0; hero.vel.y = 0;
        break;
      }
      if (pressed(state, input, 'jump')) { setState(hero, 'jump'); hero.vel.z = HERO_DATA.jumpVz; hero.vel.y = 0; }
      break;
    }
    case 'jump':
      if (pressed(state, input, 'attack')) { setState(hero, 'jumpAttack'); break; }
      if (hero.stateFrame > 1 && hero.pos.z === 0) setState(hero, dx !== 0 || dy !== 0 ? 'walk' : 'idle');
      break;
    default:
      break;
  }
}
