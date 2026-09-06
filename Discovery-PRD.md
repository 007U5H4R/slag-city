# Discovery PRD — SLAG CITY (working title)

Stage 1 of the build chain · 2026-09-05 · Status: awaiting sign-off
Source: 30-question grilling session. Defines WHAT and WHY. Solution Design (Stage 2) decides HOW.

## 1. Problem & why

The Dino Arcade PWA plays Capcom's *Cadillacs & Dinosaurs* from a user-supplied ROM. It is fine for
private use and cannot be published: the ROM is Capcom's, the characters are Mark Schultz's
(*Xenozoic Tales*), and the title is trademarked (incl. GM's *Cadillac*). Modifying the ROM would be a
derivative work; a near-clone with new sprites would be substantially similar.

What IS free: the genre (side-scrolling beat-'em-up), its mechanics, and a retro-arcade presentation.

**Goal:** a publishable, eventually commercial, *original* arcade beat-'em-up that delivers what the
owner loves about C&D — the genre and the authentic 90s arcade feel — with wholly original IP.

"What if we don't build this?" → the owner keeps a private emulator and nothing shippable exists.
Building is justified **only** by publishing; the emulator already covers private play.

## 2. Target users

- **Primary — the owner:** nostalgic 90s arcade player. The game must feel right to them first; this
  is the only audience verifiable without a user study.
- **Secondary — retro-game fans online:** will judge against *Streets of Rage 4*, *Final Fight*, C&D.
- **Not for v1:** kids, casual players, mobile/touch players.

## 3. Goals

1. Ship **one polished stage** as a **free browser demo** (itch.io + own Vercel URL).
2. **Authentic 90s arcade feel** — defined by the checklist in §7, not by mood.
3. **Original IP** — nothing copyrighted or trademarked by anyone else is used, anywhere.
4. Commercial (paid) only once **3+ stages** exist. Revenue is NOT a v1 measure.

## 4. In scope (v1)

**Game**
- Single-player. One hero: an **industrial exorcist** with a sledgehammer — the one person who
  understands what the machines are. (Deliberately not a "mechanic with a wrench" — that's Tenrec.)
- One stage, **3 sections + boss, 6–8 min**: foundry gates (teaches fodder) → conveyor floor (teaches
  hazards + salvage weapons) → furnace hall (everything at once) → boss. The stage IS the tutorial.
- Difficulty: **fair but hard** — one-credit clear achievable with skill; continues for everyone else.

**Core pillars (irreducible — cut anything else first)**
1. **Hit-feel** — hitstop, screen shake, enemies launched; the 90s "crunch".
2. **Salvage weapons (the hook)** — weapons are not in crates; they're **torn off downed machines**
   (rip an arm-cannon off a drone); they overheat and die after N hits.
3. **Neutral hazard** — **feral devil-machines** attack everyone, gang and hero alike.

**Roster**
- Fodder: **human/mutant gangs**, 3 types (palette swaps for variety).
- Hazard: 1 **feral devil-machine**.
- Boss: 1 **devil-mech** — big, demonic (horns, furnace-glow chest, molten seams; between war-mech
  and gargoyle). Our design language; nothing recognisably Transformers.

**World**
- **Occult-industrial**: a foundry city whose furnaces started forging things that shouldn't move; hell
  leaks up through the factory floor. Stage 1 = the foundry district (conveyors, molten channels,
  chain hoists = free hazards and weapons).

**Presentation**
- **Full arcade cabinet**: bezel, marquee art, **4:3 playfield**, CRT softening (the owner's one
  carried aesthetic requirement), coin-op conventions (§7).
- Violence: **cartoon-arcade, no blood** — sparks, oil, scrap; humans knocked out, not killed.
- Progress: **pure arcade** — credits + continues, no saves, **local high-score table**.

**Platform & input**
- **Desktop browser** first: keyboard + gamepad. Hosted at **itch.io (HTML5) + Vercel**.
- Touch/mobile, native, Steam: deferred (not in v1).

**Art & audio (source decisions)**
- Art: **Higgsfield-generated HD → downscaled to ~384×224 → quantised to a 64-colour palette → CRT
  pass**. Character-sheet-first pipeline (one reference sheet → every frame derived from it). Low
  frame counts (6-frame walks, 3-frame punches) — authentic AND halves generation count. AI art
  accepted in the paid version too. Fallback: licensed asset packs (commercial licence verified per pack).
- Audio: licensed **retro SFX pack** (consistency matters most for hits); licensed **FM/chiptune
  music track** for stage 1; trial AI generation for **voice barks** (announcer, grunts, boss taunt).

## 5. Explicitly out of scope

- Any Capcom / Schultz / Hasbro material: ROM, sprites, music, level layouts, character designs,
  Megatron-like designs, the word "Cadillacs". No 1:1 cast/stage mapping to C&D.
- Co-op — local or online. Netplay of any kind.
- Mobile/touch, native downloads, Steam, app stores (v1).
- Ads. Paid v1. Saves/checkpoints. Multiple heroes. Vehicle sections. Difficulty select (later).
- Possession mechanic (ride a hijacked machine) — recorded as the post-demo stretch hook.
- The emulator project — frozen at tag `freeze/dino-arcade-emulator-2026-09-05`.

## 6. Success criteria (measurable)

| # | Criterion | How verified |
|---|---|---|
| S1 | Owner plays stage 1 start → boss defeat with **keyboard** and with **gamepad**, in a desktop browser, at the itch.io URL and the Vercel URL, at a steady 60 fps | On-device run, both inputs, both hosts; frame counter |
| S2 | **All 10** items of the §7 checklist present and demonstrable | Walk-through, each item ticked |
| S3 | Owner signs off that combat "feels like 1993" | Subjective gate — owner play-test, explicit sign-off |
| S4 | A competent run takes 6–8 min; a **one-credit clear is achievable** | At least one recorded one-credit run |
| S5 | **IP audit clean**: no asset traces to protected IP; every third-party asset has a commercial licence on file; AI-content disclosure completed on itch.io | Licence manifest in repo; itch listing |
| S6 | Demo is **publicly live** at both URLs | URLs resolve, playable by a stranger |
| — | Revenue | Not a v1 measure |

## 7. Authentic-90s checklist (all ten are in)

1. 4:3 playfield in a cabinet bezel, marquee art on top
2. Attract mode — demo loop + high-score table when idle
3. "Insert Coin" + credits counter, coin sound, "Press Start"
4. Continue countdown (10…9…) with the hero down
5. High-score initials entry (AAA) on game over
6. Voice barks — announcer, hero grunts, boss taunt
7. Hitstop + screen shake on heavy hits
8. Enemy intro name-cards; boss name flash
9. Score pop-ups + food/points pickups
10. Fixed 60 fps, integer pixel scaling — no smoothing except the CRT pass

## 8. Decisions carried into Solution Design (made during discovery; Stage 2 confirms or overturns)

- Stack: **Phaser 3 + Vite + TypeScript** (mobile-web-capable, wraps to Electron/Steam later).
- Internal resolution ~384×224 (CPS-1 scale, 4:3), integer scaling, CRT post-pass.
- Reuse: `dino-arcade-pwa/js/rom-store.js` as the high-score/asset store; `DESIGN.md` cabinet / start-gate /
  controller-layout specs as inputs. Nothing else from the old project.
- Deploy: itch.io HTML5 + Vercel.
- Art budget: ~89 Higgsfield credits on hand (2026-09-02); one stage ≈ **300–500 generations**.
  Default plan is **hybrid** (Higgsfield for hero/boss/backgrounds; packs for fodder). **Owner must
  set a credit ceiling** (open question) — no art plan without a budget.
- Legal to-dos (mine, not the owner's): verify Higgsfield commercial-use terms; per-pack licence check;
  USPTO TESS + EUIPO lookup (Classes 9 & 41) on the chosen name; keep a licence manifest in the repo from day one.
- Tracer bullet for Stage 6: **one animated hero walk + punch cycle through the full art pipeline**
  (Higgsfield → downscale → palette → in-engine) before any stage art — kills the riskiest assumption
  (AI frame consistency) first.

## 9. Open questions

- **Final name.** Web collision check done 2026-09-05 (trademark registers not yet queried):
  - TAKEN — HELLFORGE (*Hellforged* on Steam 2025–26; *Hellforge Studios* publisher; Terraria/Diablo saturate search).
  - RISKY — FOUNDRY FURY (Paradox's *FOUNDRY*), RUST & BRIMSTONE (*Rust*, *Brimstone* both Steam titles).
  - CLEAR — **SLAG CITY** (working title; phonetic neighbour *Slap City* on itch), IRON EXORCIST, MOLTEN SAINTS,
    INFERNAL WORKS, FURNACE OF THE DAMNED.
  - Owner picks from the CLEAR list; then trademark lookup before it goes on a store page.
- **Higgsfield credit ceiling** (number).
- Hero's name and visual design (Stage 3).
- Which licensed SFX / music / fallback sprite packs (Stage 2/3, with licence check).

## 10. Risks

| Risk | Mitigation |
|---|---|
| AI frame-to-frame inconsistency | Downscale hides detail noise; sheet-first pipeline; tracer bullet first |
| Content scope creep (more enemies/stages) | One stage is the finish line; every addition is a new ticket with a cost |
| Name/IP collision | Working title only; trademark lookup before store listing |
| Art budget overrun | Credit ceiling + hybrid plan; palette swaps for variety |
| "90s vibe" stays subjective | §7 checklist is the definition; S3 is the one subjective gate, owner-signed |
