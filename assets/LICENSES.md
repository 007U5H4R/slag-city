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
| ENEMY ROSTER references — 3 candidates each for brawler/knife/heavy (9 stills, **text-only, NO hero image-ref** — style via text scaffold, see LEDGER deviation) → `docs/art/candidates/enemies/{brawler,knife,heavy}-{1,2,3}.png`; jobs brawler `c12d863c`/`eaf0959f`/`5fc7546a`, knife `fdb12740`/`65308882`/`5e426ab0`, heavy `187bcafe`/`d1b50af7`/`20b742e8` — **owner picked brawler-1 / knife-1 / heavy-2** → `assets/sources/enemies/<kind>/reference.png` | nano_banana_pro | Higgsfield (backing: `nano_banana_2` — **not Kling**, compliant) | 2026-09-14 | Design.md §3.6 template (per-role clauses; see LEDGER) | n/a (not returned) | 18 (2 ea × 9) | Higgsfield generation (per Higgsfield ToS) | yes |
| ENEMY ROSTER WALK — 4 frames each brawler/knife/heavy (image ref = picked ref job per kind, costume/identity locked, vary legs, framing-locked; weapon gripped for knife/heavy) → `docs/art/probes/{brawler,knife,heavy}-walk-seedream/walk-{0..3}.png` (jobs in LEDGER) | seedream_v4_5 | Bytedance (via Higgsfield) — **not Kling**, compliant | 2026-09-14 | inline per-frame pose prompts (see LEDGER enemy-roster entry) | n/a (not returned) | 12 (1 ea × 12) | Higgsfield generation (per Higgsfield ToS) | yes |
| ENEMY ROSTER ATTACK — 4 frames each brawler(punch)/knife(thrust)/heavy(hammer-slam) (image ref = picked ref job per kind, legs planted, vary arms/torso, weapon gripped throughout) → `docs/art/probes/{brawler,knife,heavy}-attack-seedream/attack-{0..3}.png` (jobs in LEDGER) | seedream_v4_5 | Bytedance (via Higgsfield) — **not Kling**, compliant | 2026-09-14 | inline per-frame pose prompts (see LEDGER enemy-roster entry) | n/a (not returned) | 12 (1 ea × 12) | Higgsfield generation (per Higgsfield ToS) | yes |

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
| 2026-09-14 | *(concurrent unrelated session — `campfire-dangle-charm`, 17× nano lucky-charm stickers @09:18/09:32–33)* — NOT Slag City spend; attributed by prompt in `show_generations` | 503.9 | 469.9 | (34, other project) |
| 2026-09-14 | ENEMY ROSTER references — 9 stills, 3 ea brawler/knife/heavy (nano_banana_pro, 2:3, text-only) — reconciled vs `transactions` (9× −2 @09:57:49–52Z = 18) — owner picked brawler-1/knife-1/heavy-2 | 469.9 | 451.9 | 18 |
| 2026-09-14 | ENEMY brawler WALK — 4 frames (seedream_v4_5, image ref) tracer — reconciled vs `balance` | 451.9 | 447.9 | 4 |
| 2026-09-14 | ENEMY knife+heavy WALK — 8 frames (seedream_v4_5, image ref) — 1 batch item + 1 retry 429'd (no job/no charge), retry succeeded — reconciled vs `balance` | 447.9 | 439.9 | 8 |
| 2026-09-14 | ENEMY brawler/knife/heavy ATTACK — 12 frames (seedream_v4_5, image ref, weapon-gripped) — reconciled vs `balance` | 439.9 | 427.9 | 12 |

¹ Live balance read at the start of this session was **510.9** (not 522.9) — the 12 cr gap is pre-existing small spend between the 09-07 reconciliation and the 09-14 top-up (background image-bg-remover + nano probes visible in the 09-07 13:40–14:04 transaction rows). Ledger anchored to the **verified live 510.9** going forward; idle/hurt rows reconciled against the `balance` tool after each batch per the standing scar.

### ⚠ Reconciliation vs Higgsfield transaction log (2026-09-07, balance tool = **22.9**)
My session log had drifted to a claimed **60.9**; the live balance is **22.9** — a **38 cr** under-count. Reconciled against `transactions` (authoritative):
88.9 −6 (ref, 09:05) −8 (stills, 09:28) −4 (seedream, 09:55) −4 (seedream, 10:30) **−2 (nano, 11:30, unlogged)** **−4 (seedream, 11:46, unlogged)** **−38 (attack, 19× nano, 12:02)** = **22.9**. Total spent = **66 cr** (logged only 28). Root cause: the attack batch was recorded from memory as "6 cr seedream" when the transaction log shows 19 nano_banana_pro generations = 38 cr; two mid-run probe batches (11:30, 11:46) were never logged. **Scar:** always read `balance`/`transactions` immediately after each generation batch and log from the transaction figure, never from the intended/expected cost.
| 2026-09-15 | *(session-start anchor — live `balance` = **392.9**, down from the 427.9 logged 09-14; the 35 cr gap is other sessions — Recraft V4.1 + GPT Image 2.5 + Nano Banana on 09-15 per `transactions`, NOT Slag City)* | 427.9 | 392.9 | (35, other) |
| 2026-09-15 | BOSS "the Foreman" reference — 2 candidates (nano_banana_pro, 2:3, text-only) → chose #1, `assets/sources/boss/reference.png` — reconciled vs `balance` | 392.9 | 388.9 | 4 |
| 2026-09-15 | BOSS walk×4 + swing×4 — 8 frames (seedream_v4_5, 2:3, image ref = boss ref, pose-varied) → `docs/art/probes/boss-seedream/` → atlas `public/assets/atlases/boss.{png,json}` (idle from reference) — reconciled vs `balance` (392.9→380.9 total incl. ref) | 388.9 | 380.9 | 8 |
| 2026-09-15 | FERAL machine reference — 2 candidates (nano_banana_pro, 3:2, text-only) → chose #1, `assets/sources/feral/reference.png` — reconciled vs `balance` | 380.9 | 376.9 | 4 |
| 2026-09-15 | FERAL move×4 + pounce×2 — 6 frames (seedream_v4_5, 3:2, image ref = feral ref) → `docs/art/probes/feral-seedream/` → atlas `public/assets/atlases/feral.{png,json}` (idle from reference, targetHeight 44) — reconciled vs `balance` (380.9→370.9 incl. ref) | 376.9 | 370.9 | 6 |
| 2026-09-15 | MARQUEE logo "SLAG CITY" — 2 candidates (nano_banana_pro, 21:9, text-only) → chose #1, `assets/sources/ui/logo.png` → `public/assets/ui/marquee.png` (768×160) + `marquee-small.png` (160×48) + `public/og.png` (1200×630) via sharp contain/cover — reconciled vs `balance` | 370.9 | 366.9 | 4 |
| 2026-09-16 | BOSS remaining actions — ground-pound×2, tear-open×2, throw×2, hurt×2, death×4 = 12 frames (seedream_v4_5, image ref = boss ref); 2 intermittent 429s (no job/no charge, resubmitted) → full boss atlas 21 frames (idle/walk/swing/ground-pound/tear-open/throw/hurt/death) — reconciled vs `balance` | 366.9 | 354.9 | 12 |
