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
| hero ATTACK — 4 kept frames (image ref = job `36273de6…`, legs-planted / hammer-swing, grip locked) → `docs/art/probes/attack-legsplanted/attack-{0..3}.png` | **nano_banana_pro** (corrected from seedream — see reconciliation) | Higgsfield (backing: `nano_banana_2` — **not Kling**, compliant) | 2026-09-07 | inline pose prompts (windup/swing/impact/recover; see LEDGER) | n/a (not returned) | **38 (19 gens × 2 — many retries; 12:02 UTC batch per transaction log)** | Higgsfield generation (per Higgsfield ToS) | yes |
| _(unlogged probes surfaced by reconciliation)_ 1× nano (11:30) + 4× seedream (11:46) — attribution uncertain; folded into the credit ledger below | nano_banana_pro / seedream_v4_5 | Higgsfield / Bytedance — **not Kling** | 2026-09-07 | — | n/a | 6 | Higgsfield generation | yes |
| hero IDLE — 4 frames (image ref = job `36273de6…`, identity locked, vary action); **chosen idle-3** (shouldered ready stance, right-facing) → `assets/sources/hero/idle.png`; probes `docs/art/probes/idle-seedream/idle-{0..3}.png` (jobs `9c7ce924`/`669407b3`/`0072948e`/`556121af`) | seedream_v4_5 | Bytedance (via Higgsfield) — **not Kling**, compliant | 2026-09-14 | inline pose prompts (per-frame; see LEDGER scaling pass) | n/a (not returned) | 4 (1 ea × 4) | Higgsfield generation (per Higgsfield ToS) | yes |
| hero HURT — 3 candidates (image ref = job `36273de6…`, identity locked, vary action); **chosen hurt-2** (head-back staggered recoil, right-facing) → `assets/sources/hero/hurt.png`; probes `docs/art/probes/hurt-seedream/hurt-{0..2}.png` (jobs `a876dc39`/`decf7523`/`2aabd3b5`) | seedream_v4_5 | Bytedance (via Higgsfield) — **not Kling**, compliant | 2026-09-14 | inline pose prompts (per-frame; see LEDGER scaling pass) | n/a (not returned) | 3 (1 ea × 3) | Higgsfield generation (per Higgsfield ToS) | yes |

## Credit ledger

| Date | Item | Credits before | Credits after | Cost |
| --- | --- | --- | --- | --- |
| 2026-09-07 | 3.3 hero reference — 3 candidates (nano_banana_pro, 2:3) | 88.9 | 82.9 | 6 |
| 2026-09-07 | 3.4 tracer — hero walk per-pose stills, 4 frames (nano_banana_pro, 2:3, image ref) — **finding: pose-locked, see LEDGER** | 82.9 | 74.9 | 8 |
| 2026-09-07 | 3.4 tracer — hero walk, 4 frames (seedream_v4_5, 2:3, image ref, pose-first) — **finding: pose variation + identity both work, see LEDGER** | 74.9 | 70.9 | 4 |
| 2026-09-07 | 3.4 — hero walk LEGS-ONLY, 4 frames (seedream_v4_5, 2:3, image ref, upper-body/hammer locked) — **hammer detachment fixed; viable walk set** → `docs/art/probes/walk-legsonly/walk-{0..3}.png` | 70.9 | 66.9 | 4 |
| 2026-09-07 | ⚠ *(entry corrected)* hero ATTACK — **actually 38 cr, 19× nano_banana_pro @2 (12:02 UTC), NOT 6 cr seedream as first logged** — nano pose-lock forced many retries; only 4 frames kept → `docs/art/probes/attack-legsplanted/attack-{0..3}.png` | 60.9 | 22.9 | 38 |
| 2026-09-14 | **owner top-up — Credit Package +500 (grant 08:48 UTC)** | 22.9 | 522.9¹ | +500 |
| 2026-09-14 | hero IDLE — 4 frames (seedream_v4_5, 2:3, image ref) → `assets/sources/hero/idle.png` (chose idle-3) — reconciled vs `transactions` | 510.9 | 506.9 | 4 |
| 2026-09-14 | hero HURT — 3 candidates (seedream_v4_5, 2:3, image ref) → `assets/sources/hero/hurt.png` (chose hurt-2) — reconciled vs `transactions` | 506.9 | 503.9 | 3 |

¹ Live balance read at the start of this session was **510.9** (not 522.9) — the 12 cr gap is pre-existing small spend between the 09-07 reconciliation and the 09-14 top-up (background image-bg-remover + nano probes visible in the 09-07 13:40–14:04 transaction rows). Ledger anchored to the **verified live 510.9** going forward; idle/hurt rows reconciled against the `balance` tool after each batch per the standing scar.

### ⚠ Reconciliation vs Higgsfield transaction log (2026-09-07, balance tool = **22.9**)
My session log had drifted to a claimed **60.9**; the live balance is **22.9** — a **38 cr** under-count. Reconciled against `transactions` (authoritative):
88.9 −6 (ref, 09:05) −8 (stills, 09:28) −4 (seedream, 09:55) −4 (seedream, 10:30) **−2 (nano, 11:30, unlogged)** **−4 (seedream, 11:46, unlogged)** **−38 (attack, 19× nano, 12:02)** = **22.9**. Total spent = **66 cr** (logged only 28). Root cause: the attack batch was recorded from memory as "6 cr seedream" when the transaction log shows 19 nano_banana_pro generations = 38 cr; two mid-run probe batches (11:30, 11:46) were never logged. **Scar:** always read `balance`/`transactions` immediately after each generation batch and log from the transaction figure, never from the intended/expected cost.
