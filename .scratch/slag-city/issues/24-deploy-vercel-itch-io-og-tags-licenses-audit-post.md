# 24 — Deploy: Vercel + itch.io + OG tags + LICENSES audit + post-deploy smoke

**What to build:** The demo is publicly playable at a Vercel URL and an itch.io page, link previews show the marquee, every shipped asset is accounted for, and a smoke test runs against production after each deploy.

**Blocked by:** 21, 22, 23

**Status:** ready-for-agent

- [ ] Vercel: production from `main`, previews per PR, long-cache headers on hashed assets
- [ ] itch.io HTML5 upload at 1152×672 with fullscreen, AI-content disclosure set; first release manual, `butler` from CI on a tag thereafter with the key as a CI secret
- [ ] Open Graph + Twitter Card tags with absolute HTTPS URLs to the OG image; verified with LinkedIn Post Inspector and opengraph.xyz
- [ ] `LICENSES.md` audit: every asset has source, model, provider, date, prompt, licence and AI flag; no Kling-backed provider
- [ ] Post-deploy Playwright smoke green on the production URL; a stranger completes coin → start on both URLs
- [ ] No telemetry, analytics or accounts shipped
