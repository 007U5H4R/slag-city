# 22 — Audio: SFX manifest, music, voice barks, unlock

**What to build:** Hits, coins, pickups, weapon breaks and UI beats have consistent retro SFX; the stage, boss and title each have a chiptune/FM track; announcer, hero grunts and a boss taunt play at their moments — all licensed and logged.

**Blocked by:** 18

**Status:** ready-for-agent

- [ ] SFX pack and music tracks chosen with their commercial licences verified and recorded in `LICENSES.md`
- [ ] Audio manifest maps event ids → files; core emits events, the adapter plays them
- [ ] Voice barks trialled on Higgsfield audio (same provider rule) or cut if quality/licence fails
- [ ] Volume persists in localStorage; audio unlocks on first keypress; hidden tab mutes
- [ ] Every checklist beat has a sound: coin, start, hit light/heavy/launch, knockdown, pickup, weapon break, name-card, continue tick, game over, hi-score confirm

