<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# New World Idle — Project Summary

## Goal
Build and deploy New World Idle, a browser-first idle MMORPG at `/Volumes/Bren 2TB/opencodegui/newworld`

## Stack
- Next.js 16.2.7 (App Router) + TypeScript + TailwindCSS + Supabase (PostgreSQL + Auth) hosted on Vercel

## Core Principles
- Database first, server-authority, no hardcoded values, data-driven content
- Mobile-first (360px min), offline progress core, shared account storage, 4 characters/account
- Economy: 3 currencies (Gold, Knowledge, Bob Coin); Bob Coin never provides power; 70–90% gold sinks
- Build for content velocity — adding content should not require code changes

## Status
- All 6 migrations pushed to Supabase project `wvxobwqdgzyfyqabrdtv`
- Live URL: `https://newworld-zeta.vercel.app`
- Current commit: not yet committed (Tasks 1-4 deliverables)
- GAME_REVIEW.md written: score 4.5/10, launch readiness 15%

## Completed Features
- Auth (email + Google OAuth), dashboard (4 chars), world (8 tabs: HOME/GATHER/CRAFT/EXPLORE/CONTRACTS/STORAGE/DISCOVER/CHAR)
- Server-authoritative: start/claim profession, start/claim exploration, complete/reroll contract, process-offline, assign-attribute
- 26 discoveries, 10 contract types, Starter Town region, attribute system (STR/DEX/INT/END/LCK/CHA)
- Offline progress on login, gold sinks (reroll scaling), sound effects (click/reward/error/rare/level-up/discovery)
- Discovery system: grid with lore, region timeline, rarity stats, completion %, animations, sound

## Latest (Tasks 1-4 Deliverables)
1. **Better Reward Popup** — Consolidated offline/exploration/profession rewards with items, XP, gold, level-ups, discoveries, lore
2. **Mobile UX Audit** — 44px touch targets, responsive breakpoints (430/390/360), `.bottom-nav` class, horizontal scroll prevention, removed tiny button overrides
3. **Discovery System** — Lore text (24 discoveries with unique lore), region timeline, rarity-colored borders, flip animation, discovery sound, click-to-expand lore
4. **Item Image Upload** — Admin page at `/admin/items`, API route `/api/admin/upload-item-image` (dev-only: dadaleow@gmail.com), stores to `public/assets/items/<id>.png`, updates `content_items.icon_path`, lists all items needing images

## Known Issues
- 30-min first action too slow (critical), no tutorial (critical), no notification system (high)
- KP has no purpose, gold sinks insufficient, no PWA support, stub pages return 404

## Relevant Files
- `src/components/reward-feedback.tsx` — Consolidated reward popup
- `src/components/discoveries-tab.tsx` — Discovery grid with lore + timeline
- `src/app/globals.css` — Mobile + animation CSS
- `src/app/admin/items/page.tsx` — Dev item image upload UI
- `src/app/api/admin/upload-item-image/route.ts` — Dev image upload API
- `supabase/migrations/006_discovery_lore.sql` — Lore + region tracking migration
- `src/lib/sound.ts` — Sound effects including discovery
- `GAME_REVIEW.md` — Full game review
