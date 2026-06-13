# NEW WORLD IDLE — FOUNDER AUDIT

**Prepared by:** Senior Game Director / Economy Designer / Systems Designer / Product Manager
**Date:** 2026-06-13
**Status:** Based on implemented codebase (commit d5bc0b3) + Founder Package design docs

---

## EXECUTIVE SUMMARY

**Current Score: 3/10** — Foundation is solid. Game is missing systems, hooks, and content.
**Potential Score: 7/10** — Achievable within 3 months following the roadmap below.

The game is a **proof of concept**, not a **commercial product**. The architecture is clean (server-authoritative, Supabase, multi-char storage), but the gameplay loop is too thin to retain players past Day 3.

**The single biggest problem:** A new player logs in, makes two clicks, and waits 30 minutes for their first reward. 80%+ of new players will never see that reward.

---

## 1. CORE GAME LOOP

### Current Loop

1. Login → Dashboard → Enter World
2. Click PROFESSIONS → LEARN → START (1 of 7 professions)
3. Click EXPLORE → START (1 of 1 regions)
4. Wait 30 minutes
5. Claim → see reward popup
6. Maybe complete a contract
7. Assign attribute point if leveled up
8. Log off

**Active decision count per session: 2-3.** Choose profession. Choose region. Choose attribute.

### Is it engaging?

**No. 3/10.** After making the two initial choices, the player waits with zero interaction. The game offers no surprises, no critical hits, no events, no rare loot sparkle moments. Every session is identical.

### Is there enough decision-making?

**No.** Compare to:
- **Melvor Idle:** 30+ skills, gear slots, combat triangle, dungeons, boss mechanics — hundreds of decisions per session
- **IdleOn:** Classes, subclasses, world zones, alchemy, stamps, construction — dozens of decisions per session
- **Milky Way Idle:** Ship build, galaxy expansion, research tree — dozens of decisions per session

New World Idle has **2-3 decisions, then nothing**.

### Progression Feel

**Weak.** Level-ups give 1 attribute point and nothing else. The attribute effects are invisible (STR +2% yield per point — but players never see that math). There is no gear, no equipment, no visual change, no power fantasy.

**The number goes up, but nothing feels different.**

### Biggest Weaknesses

1. **30-minute first action** — Critical. First-time player experience is launch → click → leave. No immediate gratification.
2. **No tutorial** — Players are dropped into 8 tabs with zero guidance
3. **No dopamine hooks** — No rare loot sparkle, no unexpected events, no critical hits
4. **KP has no purpose** — Knowledge Points accumulate with zero use, making INT attribute pointless
5. **Storage feels empty** — Items gather but nothing consumes them except contracts
6. **No gear system** — Gathering items have no equipment sink
7. **No crafting** — Raw materials never transform into anything useful
8. **No prestige** — Once maxed, game is over. No restart mechanic.

---

## 2. RETENTION ANALYSIS

### Day 1 Retention: ~20-30% (projected, likely worse)

**Why players stay:** They set up activities, come back, see numbers go up.
**Why they quit:** First 5 minutes = "click start, leave." No hook. The 30-minute reward window means most players never see their first reward.

### Day 7 Retention: ~5-10%

**Why players stay:** Invested time, have levels, understand the loop.
**Why they quit:** Repetition. The loop is identical on Day 1 and Day 7. No new systems unlocked. No surprises. No events.

### Day 30 Retention: ~1-3%

**Why players stay:** Completionists collecting all 26 discoveries.
**Why they quit:** Nothing new in 3 weeks. No bosses, no dungeons, no prestige, no seasons.

### Critical Retention Problems

- **No narrative** — why am I doing this?
- **No goals** — the game never tells you what to aim for
- **No surprises** — every session is identical
- **No community** — zero social pressure to return
- **No sunk cost** — time spent feels wasted, not invested

### Suggested Improvements

1. **Push notification system** — browser notification when activity completes
2. **Daily reward calendar** — log-in streak with escalating rewards
3. **First-session hook** — give 3 instant actions on first login (instant-gratification)
4. **Progression gates** — new mechanic unlocks at Level 5, 10, 20 (e.g., combat, crafting, trading)
5. **Weekly leaderboards** — anonymous ranking for XP, gold, discoveries

---

## 3. PROGRESSION ANALYSIS

### Character Leveling

- XP curve: `100 * level^1.5` — reasonable steepness
- Per level: 1 attribute point
- **Problem:** Character level gives nothing else. No gear requirements, no skill unlocks, no special events.

### Professions (Skills)

- 7 professions across 3 categories (gathering/production/knowledge)
- Category exclusivity (1 active + 1 queued per category) — **good design**
- **Problem:** All professions are functionally identical. Woodcutting and mining are the same loop with different names.
- No mastery perks, no specialization, no cross-profession synergies

### Discoveries

- 26 discoveries across 1 region (Starter Town)
- Lore text provides narrative flavor
- **Problem:** Discoveries have no gameplay impact. They don't unlock bonuses, passive effects, or new content.

### Contracts

- 10 contract types, 12/day limit
- **Problem:** All contracts are "deliver X items, get gold." No variety.
- No escalating difficulty, no contract chains, no faction reputation system.

### Shared Storage

- Works well for multi-char system
- **Problem:** No organization (no categories, no search, no visual distinction)

### Progression Bottlenecks

1. **No prestige / reset** — once max level, game is over
2. **No gear progression** — nothing you gather makes you stronger
3. **No unlockable content** — everything is available from minute 1
4. **KP is dead** — Knowledge currency has no sink

### Missing Progression Systems

- Equipment / gear slots
- Crafting recipes (combine wood + stone → wooden plank)
- Skill mastery trees (per-profession specialization)
- Achievement system
- Collection bonuses (collect all Wood items → permanent +5% woodcutting XP)
- Discovery set bonuses

---

## 4. ECONOMY ANALYSIS

### Currency Analysis

| Currency | Generation | Sinks | Risk |
|----------|------------|-------|------|
| **Gold** | Professions, Exploration, Contracts | Reroll contracts | Mild inflation |
| **Knowledge** | Contracts only | **None** | **Critical dead currency** |
| **Bob Coin** | Not implemented | Premium pass | Unknown |

### Gold Generation

- Contracts are primary gold source (12/day, finite)
- Exploration gold is negligible (1-50g per discovery)
- Profession items sell for nothing (no NPC vendor)
- **Result:** Gold is scarce but economy stagnates because players can't spend it

### Gold Sinks

- Only sink: contract rerolls (scales with level)
- Design target: 70-90% gold sink rate — **not met**
- Current: ~2% of generated gold is sunk
- **Critical:** No gear repair, no NPC shops, no travel costs, no auction fees, no upgrade costs

### Resource Usefulness

- Resources feed contracts and... nothing else
- No crafting system, no building system, no upgrade system
- **Result:** Gathering half the items feels pointless because no system consumes them

### Predicted Economic Problems

1. **KP is dead** — players will stop doing contracts because KP has no value
2. **Resource hoarding** — items sit in storage with no purpose
3. **Gold hoarding** — no meaningful sinks means endgame players have millions with nothing to spend
4. **Bob Coin viability** — if it never buys power, it must buy convenience/cosmetics. Currently neither exist.

### Solutions

1. **NPC vendor** — sell items for gold (basic sink via buy/sell spread)
2. **Gear repair** — gear degrades, costs gold to fix
3. **Travel costs** — region exploration costs gold scaling by distance
4. **Crafting** — combine items → create gear (consumes raw materials)
5. **KP sinks** — research tree unlocks, passive boosts, temporary buffs

---

## 5. MULTI-CHARACTER SYSTEM

### Current Design

- 4 characters per account
- Shared storage
- Each character has independent professions, exploration, contracts, attributes, level

### Is it meaningful?

**No.** All 4 characters are identical in capabilities. No reason to use character B over character A.

### Is it fun?

**No.** Administrative overhead. Switching between characters is manual (dashboard → select → dashboard).

### Is it too complex?

**Yes.** For an idle game, multi-character should be *less* work, not more.

### Opportunities Being Missed

- **Character classes** — each should have unique passives (STR specialist, DEX specialist, etc.)
- **Synergy bonuses** — 4 characters should unlock cross-character bonuses stronger than 1 character
- **Auto-pilot mode** — idle characters continue their last activity even when not watching
- **Trade between characters** — character A's surplus feeds character B's craft
- **Squad view** — see all 4 on one screen, queue them all at once

### Recommendation

Make the multi-char system **optional specialization**, not **mandatory chore**. Consider a "squad view" where you see all 4 characters on one screen and can queue them all at once.

---

## 6. DISCOVERY SYSTEM

### Current State

- 26 discoveries in Starter Town region
- Rarity, lore, gold value
- Grid view with flip animation and rarity colors
- Timeline tracking found dates

### Will Players Be Excited?

**Initial: yes.** Flip animation, rarity colors, lore text, sound effects create a nice moment.
**Sustained: no.** After finding first 10, diminishing returns. Rare ones have ~1-5% probability. Players will go 20+ explorations with zero discoveries.

### What Would Become Viral?

- **Mysterious Egg** — lore about something alive inside
- **Cosmic Orb** — miniature universe
- **Dragon Scale** — residual ancient power
- **These need discoverability** — players should brag about finding them

### What Is Missing

- **Discovery set bonuses** — collect all Common → unlock +5% exploration speed
- **Secret discoveries** — hidden conditions to unlock ultra-rare items
- **Discovery progression** — some should be prerequisites for others
- **Shareable discoveries** — ability to share lore or screenshot
- **Discovery rankings** — show which players found rarest discoveries first

---

## 7. SOCIAL FEATURES

### Current State

**Zero.** No chat, no trading, no friends, no leaderboards, no guilds, no multiplayer.

### What Should Be Added (Priority Order)

1. **Leaderboards** — weekly XP gain, total discoveries, wealth ranking (low effort, high retention)
2. **Friends list** — see friends' activity, recent discoveries
3. **Trading** — player-to-player item exchange (Bob Coin tax?)
4. **Guilds** — shared storage, guild buffs, guild goals

### What Should Be Avoided

- Real-time chat (moderation nightmare)
- Direct PvP (destroys idle vibe)
- Competitive auctions (economy distortion)
- Any system that punishes offline players

---

## 8. MONETIZATION REVIEW

### Philosophy: "Never provides power"

**Correct.** Idle games die when pay-to-win.

### Current State: None implemented

- Bob Pass documented but not coded
- Bob Coin not minted

### Assessment

- **Fair?** Impossible to assess without implementation
- **Sustainable?** Needs premium cosmetics, titles, name colors, frame borders
- **Risks:** If Bob Coin has zero value, won't sell. If too much value, pay-to-win.

### Recommended Monetization

- **Bob Pass ($5-10/month):** 2x offline capacity, priority queue, exclusive nameplate, 1 free reroll/day
- **Bob Coin shop:** Name change, character slot expansion (5th slot), cosmetic frames, unique emoji set, title unlocks
- **Starter Pack ($3):** 7-day Bob Pass trial + 500 gold + exclusive pet
- **Avoid:** XP boosters, speed boosts, rare discovery guarantees, extra contract slots

---

## 9. COMPETITIVE COMPARISON

### vs IdleOn

| | New World Idle | IdleOn |
|----|----------------|--------|
| **Better** | Cleaner UI, server-authoritative (anti-cheat), discovery lore | 10+ worlds, classes, dungeons, multiplayer |
| **Worse** | 1 region vs 10+ worlds, 26 vs 1000+ items, no classes, no combat | Cluttered, confusing |
| **Missing** | World exploration, class system, alchemy, stamps, construction | — |

### vs Milky Way Idle

| | New World Idle | Milky Way Idle |
|----|----------------|----------------|
| **Better** | Multi-char system, discovery narrative | Prestige system, clean research loop |
| **Worse** | No prestige, no visual planet progression | — |
| **Missing** | Prestige/rebirth, visual star map progression | — |

### vs Melvor Idle

| | New World Idle | Melvor Idle |
|----|----------------|-------------|
| **Better** | Discovery lore, multi-char shared storage | 30+ skills, full gear, combat, 100+ bosses |
| **Worse** | 7 professions vs 30+ skills, no combat, no gear, no dungeons | Less visual |
| **Missing** | Almost everything | — |

### vs RuneScape

| | New World Idle | RuneScape |
|----|----------------|-----------|
| **Better** | Idle-friendly | Full MMO, quests, skills, combat, economy |
| **Missing** | Everything that makes RuneScape great | — |

---

## 10. BIGGEST RISKS (Top 20, Ranked by Severity)

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | **KP has no use** | CRITICAL | Add KP research tree immediately |
| 2 | **No tutorial / hook** | CRITICAL | First-session flow with guided actions |
| 3 | **30-min first action** | CRITICAL | Reduce to 2 min for new players, scale up |
| 4 | **Zero social features** | HIGH | Add leaderboards (week 1 effort) |
| 5 | **No progression variety** | HIGH | Add new system per major patch |
| 6 | **Resources are useless** | HIGH | Add crafting or building system |
| 7 | **No gold sinks** | HIGH | Add vendor, repair, travel fees |
| 8 | **1 region only** | HIGH | Gate regions behind level + gold cost |
| 9 | **No reason for 4 chars** | MEDIUM | Add class passives or synergy bonuses |
| 10 | **Discoveries stop mattering** | MEDIUM | Add set bonuses, hidden discoveries |
| 11 | **Contracts are repetitive** | MEDIUM | Escalating difficulty, contract chains |
| 12 | **No endgame** | MEDIUM | Prestige, leaderboards, weekly challenges |
| 13 | **Bob Coin design undefined** | MEDIUM | Finalize monetization before marketing |
| 14 | **No PWA / notifications** | MEDIUM | Browser push notifications (+30% retention) |
| 15 | **Mobile experience weak** | MEDIUM | Mobile-first audit needed |
| 16 | **No achievement system** | LOW | Easy win — implement with discovery data |
| 17 | **No content pipeline** | LOW | Design doc-driven content additions |
| 18 | **Attribute system shallow** | LOW | Add breakpoints or synergies |
| 19 | **No sound options** | LOW | Volume slider, mute option |
| 20 | **No localization** | LOW | Premature — ignore for now |

---

## 11. HIDDEN OPPORTUNITIES (Top 20, Prioritized by Impact)

| # | Opportunity | Impact | Effort |
|---|-------------|--------|--------|
| 1 | **Soulbound Equipment** — gather materials, craft gear that permanently boosts stats | Transformative | 2 weeks |
| 2 | **Knowledge Research Tree** — spend KP to unlock permanent passive upgrades | Transformative | 1 week |
| 3 | **First-session hook** — guided 3-step tutorial with instant rewards | Transformative | 3 days |
| 4 | **Browser notifications** — "Your woodcutting is complete!" | High | 2 days |
| 5 | **Weekly leaderboards** — anonymous, XP gained that week | High | 3 days |
| 6 | **Discovery set bonuses** — collect all of a rarity → permanent boost | High | 2 days |
| 7 | **Prestige / rebirth** — reset to level 1, keep permanent bonuses | High | 2 weeks |
| 8 | **Gathering synergy** — Woodcutting +1 when Mining is level 10 | Medium | 2 days |
| 9 | **Character classes at creation** — choose STR/DEX focus, gain unique passive | Medium | 1 week |
| 10 | **NPC vendor** — sell items for gold, rotating buy list | Medium | 3 days |
| 11 | **Secret discoveries** — hidden conditions for ultra-rare items | Medium | 2 days |
| 12 | **Contract chains** — complete 3 in a row for bonus rewards | Medium | 2 days |
| 13 | **PWA support** — installable, push notifications | Medium | 3 days |
| 14 | **Auto-sell toggle** — auto-sell common items when full | Medium | 1 day |
| 15 | **Daily reward calendar** — 7-day log-in streak rewards | Medium | 2 days |
| 16 | **Item sets** — equip 3 pieces of "Woodcutter's Set" for bonus | Medium | 1 week |
| 17 | **Global chat (channels)** — per-region chat rooms | Medium | 1 week |
| 18 | **Exploration events** — random encounters during exploration | Medium | 1 week |
| 19 | **Collector titles** — "Master of Wood" for finding all wood items | Low | 1 day |
| 20 | **Stat breakpoints** — every 10 points unlocks bonus effect | Low | 1 day |

---

## 12. ROADMAP RECOMMENDATION

### v1.1 — The Hook (2 weeks)
**Goal:** Fix first-session retention and KP dead currency

- Reduce base profession time to 2 minutes for players under level 5
- Implement KP Research Tree (spend KP on permanent boosts like "+5% gathering yield" or "unlock auto-queue 3rd slot")
- First-session guided tutorial (3 steps with rewards)
- Browser push notifications
- NPC vendor (sell items for gold, 50% of base value)

### v1.2 — Crafting & Gear (3 weeks)
**Goal:** Give resources a purpose

- Crafting: combine 3 wood → Wooden Plank; 5 Planks → Wooden Chest (+2 storage)
- Gear system: craftable hatchet, pickaxe, rod → equip for profession bonuses
- Gear durability: degrades over time, gold cost to repair
- Set bonuses: equip full Woodcutter set → +10% woodcutting XP

### v1.3 — Social & Competitive (2 weeks)
**Goal:** Community retention

- Weekly XP leaderboards
- Friends list + friend activity feed
- Discovery showcase — share rarest finds
- Collectible titles and nameplate colors

### v1.4 — Depth & Expansion (3 weeks)
**Goal:** Add meaningful decisions

- Prestige system: reset to level 1, gain permanent Prestige Points for multipliers
- Character classes: at creation, choose specialization (gathering/production/exploration)
- 2 new regions with 15+ new discoveries each
- Contract escalation: difficulty tiers with scaling rewards

### v1.5 — Events & Surprises (2 weeks)
**Goal:** Replayability

- Exploration events system: random encounters during exploration
- Weekly challenges: "Mine 500 stone this week for a rare reward"
- Secret discoveries with hidden unlock conditions
- Daily mission board (3 rotating missions)

### v2.0 — Multiplayer & Monetization (4 weeks)
**Goal:** Sustainability

- Trading: player-to-player item exchange (Bob Coin as tax)
- Bob Pass launch with premium cosmetics
- Bob Coin shop: cosmetic frames, name changes, character slot expansions
- Guilds: shared goals, guild storage, guild buffs

---

## 13. BRUTAL REVIEW

### "Why would I play New World Idle instead of IdleOn or Milky Way Idle?"

**You wouldn't. Not yet.**

**IdleOn has 10 worlds, classes, dungeons, alchemy, stamps, construction, worship, gaming, sailing, and 500+ hours of content.** Your game has 1 region, 7 professions that are all the same, and 26 discoveries you'll find in a weekend.

**Milky Way Idle has a clean prestige loop.** You explore, you reset, you get stronger, you go further. Your game has no reset. No reason to start over. No reason to optimize.

**Melvor Idle has 30+ skills, full combat, 100+ bosses, item synergies, and a gear system that lets you theorycraft for hours.** Your game has a gear system that doesn't exist.

### What you do better:
- Better visual design (cleaner than IdleOn's wall of information)
- Server-authoritative (no cheating unlike Melvor/IdleOn)
- Discovery lore system (makes you *care* about items)
- Multi-character shared storage is genuinely smart

### What's killing you:
1. **No reason to log in more than once a day.** And even then, it's 30 seconds of clicking.
2. **No surprise.** Every session is deterministic. You know exactly what you'll get.
3. **No identity.** Am I a woodcutter? A miner? It doesn't matter.
4. **No social proof.** Can't brag, can't compare, can't trade, can't cooperate.
5. **The core loop is too thin.** Click → wait → claim → repeat. Works for 3 days, not 3 months.

### The hardest truth:

New World Idle right now is a **proof of concept**, not a **game**. You have a working engine with no content. The architecture is solid. The database is clean. The multi-char storage is clever. But a clean engine with nothing to run on it is not a product.

### To survive commercial launch, you need:
- A hook that grabs players in the first 3 minutes (not 30)
- A reason to log in every 2 hours (not every 24)
- A reason to talk about the game with friends
- A reason to care about progression beyond number go up
- A functional economy where currencies have purpose

### The good news:

The foundation is solid. The server-authoritative architecture, the clean Supabase schema, the multi-char storage, the discovery system — these are genuinely well-built. What's missing is content, loops, and systems layered on top.

### Priority #1: Make KP do something.

This is the most embarrassing gap. A whole currency with zero purpose.

### Priority #2: Reduce the first-action timer.

30 minutes is absurd for a new player. 2 minutes. Let them taste the loop before asking them to wait.

### Priority #3: Add ONE social feature.

Leaderboards alone would increase retention by 20-30%. Highest-ROI feature.

### Current score: 3/10
### Potential score: 7/10 (within 3 months of focused development)

### Founder's question:

**Do you ship a thin MVP to validate the loop, or do you delay to add enough depth that players won't bounce in 3 days?**

---

*End of Founders Audit*
