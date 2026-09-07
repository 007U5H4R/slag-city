# Asset Licences

**Credit budget (owner, 2026-09-07):** no hard ceiling number — owner delegated *economical spend*
("do what is right with Higgsfield, if you need extra credit let me know"). Rule of engagement: tracer-first
(smallest useful slice; measure real cost + AI frame consistency before scaling) and **flag the owner before
credit runs low**, not after. Balance at Phase B start = **88.9 Higgsfield credits (Pro plan)**.

**Rules (Solution-PRD §6):** no Kling-backed model for any shipped asset; no third-party IP in
prompts/references; provenance metadata never stripped; AI disclosure on store pages.

## Non-AI assets

| Asset | Source | Prompt | Seed | Date | Model | Licence | AI-generated |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Press Start 2P | Google Fonts (CodeMan38) | — | — | 2026-09-07 | — | SIL OFL 1.1 (assets/sources/fonts/OFL.txt) | no |

## AI generations (Higgsfield)

| Asset | Model | Provider (backing) | Date | Prompt path | Seed | Cost (cr) | Licence | AI |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hero reference — **chosen: candidate #1 (masked exorcist)** → `assets/sources/hero/reference.png` (candidates: `docs/art/candidates/hero-ref-{1,2,3}.png`) | nano_banana_pro | Higgsfield (backing: `nano_banana_2` — **not Kling**, compliant) | 2026-09-07 | `assets/sources/hero/reference.prompt.txt` | n/a (not returned) | 6 (2 ea × 3) | Higgsfield generation (per Higgsfield ToS) | yes |
| 3.4 tracer — hero walk per-pose stills (4 frames, image ref = job `36273de6…`) → probe artifacts `docs/art/probes/walk-stills/*.png` (frame 0/1/3 saved; frame 2 straggler) | nano_banana_pro | Higgsfield (backing: `nano_banana_2` — **not Kling**, compliant) | 2026-09-07 | inline pose prompts (per-frame; see LEDGER 3.4) | n/a (not returned) | 8 (2 ea × 4) | Higgsfield generation (per Higgsfield ToS) | yes |
| 3.4 tracer — hero walk (4 frames, image ref = job `36273de6…`, pose-first prompts) → probe artifacts `docs/art/probes/walk-seedream/seedream-walk-{0..3}.png` | seedream_v4_5 | Bytedance (via Higgsfield) — **not Kling**, compliant | 2026-09-07 | inline pose prompts (per-frame; see LEDGER 3.4) | n/a (not returned) | 4 (1 ea × 4) | Higgsfield generation (per Higgsfield ToS) | yes |
| 3.4 — hero walk LEGS-ONLY (4 frames, image ref = job `36273de6…`, upper-body/hammer locked to reference) → `docs/art/probes/walk-legsonly/walk-{0..3}.png` (candidate walk-cycle source) | seedream_v4_5 | Bytedance (via Higgsfield) — **not Kling**, compliant | 2026-09-07 | inline pose prompts (per-frame; see LEDGER 3.4) | n/a (not returned) | 4 (1 ea × 4) | Higgsfield generation (per Higgsfield ToS) | yes |
| hero ATTACK (4 frames, image ref = job `36273de6…`, legs-planted / hammer-swing, grip locked) → `docs/art/probes/attack-legsplanted/attack-{0..3}.png` | seedream_v4_5 | Bytedance (via Higgsfield) — **not Kling**, compliant | 2026-09-07 | inline pose prompts (windup/swing/impact/recover; see LEDGER) | n/a (not returned) | 6 (~1.5 ea × 4) | Higgsfield generation (per Higgsfield ToS) | yes |

## Credit ledger

| Date | Item | Credits before | Credits after | Cost |
| --- | --- | --- | --- | --- |
| 2026-09-07 | 3.3 hero reference — 3 candidates (nano_banana_pro, 2:3) | 88.9 | 82.9 | 6 |
| 2026-09-07 | 3.4 tracer — hero walk per-pose stills, 4 frames (nano_banana_pro, 2:3, image ref) — **finding: pose-locked, see LEDGER** | 82.9 | 74.9 | 8 |
| 2026-09-07 | 3.4 tracer — hero walk, 4 frames (seedream_v4_5, 2:3, image ref, pose-first) — **finding: pose variation + identity both work, see LEDGER** | 74.9 | 70.9 | 4 |
| 2026-09-07 | 3.4 — hero walk LEGS-ONLY, 4 frames (seedream_v4_5, 2:3, image ref, upper-body/hammer locked) — **hammer detachment fixed; viable walk set** → `docs/art/probes/walk-legsonly/walk-{0..3}.png` | 70.9 | 66.9 | 4 |
| 2026-09-07 | hero ATTACK, 4 frames (seedream_v4_5, 2:3, image ref, legs-planted/hammer-swing, grip locked) — **hammer attached, dynamic slam; scaling pass** → `docs/art/probes/attack-legsplanted/attack-{0..3}.png` | 66.9 | 60.9 | 6 |
