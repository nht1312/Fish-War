# Implementation Plan: Fish War MVP

Source of truth: `CLAUDE.md` §2–§16 (the `docs/*_SPEC.md` files are empty).
Project init (§15 step 1) is done — commit `1200a6e`.
Detailed tasks with acceptance criteria live in `tasks/todo.md`.

## Overview

Build the 1v1 Fish-vs-Fisherman game in the order from CLAUDE.md §15: an offline,
playable gameplay loop first (Phases 1–4), then multiplayer with server authority
(Phase 5), then UI and polish (Phase 6). Phases 1–4 are planned in detail; Phases
5–6 are planned coarsely and should be re-planned at the Phase 4 checkpoint, once
the simulation's shape is real.

## Architecture Decisions

1. **One pure simulation, run in two places.** `packages/game-core` exposes
   `createMatch(config)` and `stepMatch(state, inputs, dt) → state`. Offline, the
   browser runs it directly. In Phase 5, the server runs the *same* function
   authoritatively, and the client only sends inputs. Building offline this way
   means multiplayer is not a rewrite.
2. **Fixed timestep, independent of rendering.** The sim ticks at a fixed rate
   (`TICK_RATE = 30`, inside the §8 20–30 Hz server target) through a pure
   accumulator helper. The R3F `useFrame` loop feeds real frame time in and renders
   the latest state. No gameplay in React components (§5, §9).
3. **Systems as small pure modules, not a game class.** `stepMatch` composes
   `fishMovement`, `fishermanMovement`, `line`, `stamina`, `waterGun`, `net`,
   `outcome`… each in its own file with its own tests (§11).
4. **All tuning in one config object.** Speeds, ranges, cooldowns, and tension limits
   live in `game-core/src/config.ts` (`DEFAULT_CONFIG`) and are passed in, not
   hard-coded. That covers the "no magic numbers" rule, and tests can use custom
   configs.
5. **Shared types in `game-types`.** `Vec3`, `MatchState`, `FishInput`,
   `FishermanInput`, `LineState`, and `MatchOutcome` go here, because the web, the
   server, and the core all need them.
6. **World model: 2.5D.** Y is up and the water surface is `y = 0`. The fish moves in
   XZ and dives in −Y, clamped to `[-POND_DEPTH, 0]`. The fisherman moves in XZ on a
   dock/shore strip at fixed height. The pond is an axis-aligned box, and a marked
   **escape zone** at the far edge is where the fish can escape.
7. **Line = gameplay model, not a rope sim (§9).** State is
   `{ phase: idle|cast|hooked, length, maxLength, tension, drag }`. Rendered as a
   straight segment, or a cosmetic curve, from rod tip to hook/fish. Tension is a pure
   function of fish pull vs. line length, reel, rod, and drag.
8. **Defer Rapier.** No gameplay collision in the MVP needs a physics engine. Simple
   kinematics and clamps are enough, and they keep `game-core` dependency-free and
   server-runnable. We revisit only if a task truly needs rigid bodies.
9. **Offline control scheme: local hot-seat.** Both roles share one keyboard (Fish
   on the left hand, Fisherman on the right) so the battle can be tested without
   networking. Input mapping lives in `apps/web` and produces `FishInput` /
   `FishermanInput`.
10. **Zustand only for UI-facing state** (HUD values, match phase, and later the
    connection status). The sim state lives in a plain ref owned by the loop, and it
    is mirrored into the store at a throttled rate for the HUD.
11. **No PostgreSQL/Redis in this plan.** A single-process 1v1 room needs neither.
    Add them only when persistence or multi-instance matchmaking is requested.

### New dependencies (each is justified in its task)

| Package | Where | Why |
|---|---|---|
| `three`, `@types/three` | web | 3D rendering (stack §6) |
| `@react-three/fiber` | web | React renderer for three (stack §6) |
| `zustand` | web | HUD/UI state (stack §6). Added in Task 8, not before |

`@react-three/drei` and Rapier are intentionally **not** added.

## Task Index (details in `tasks/todo.md`)

### Phase 1 — Scene & movement
- [x] 1. Basic 3D scene renders
- [x] 2. Fixed-tick simulation drives the scene
- [x] 3. Fish swims horizontally
- [x] 4. Fish dives and surfaces
- [x] 5. Fisherman moves on the dock
- **Checkpoint A** — both avatars controllable

### Phase 2 — Rod & line
- [x] 6. Fisherman aims and casts the rod
- [x] 7. Fish gets hooked; line length constrains the fish
- [x] 8. Line tension and line break (HUD tension bar)
- [ ] 9. Reel and drag
- **Checkpoint B** — the fight on the line is playable

### Phase 3 — Fish vs Fisherman actions
- [ ] 10. Fish stamina, sprint, and exhaustion
- [ ] 11. Fish dash
- [ ] 12. Water gun and fisherman knockout
- [ ] 13. Fisherman dodge
- **Checkpoint C** — every §3 ability works

### Phase 4 — Capture & match
- [ ] 14. Fishing net captures the fish
- [ ] 15. Match state: countdown, timer, escape zone, outcome, restart
- **Checkpoint D** — full offline match, start to finish. **Re-plan Phases 5–6 here.**

### Phase 5 — Multiplayer (coarse)
- [ ] 16. Network protocol types and message validation
- [ ] 17. Server room: two clients, role assignment, authoritative tick
- [ ] 18. Client online mode: send inputs, render server snapshots
- [ ] 19. Server input validation and rate limiting
- [ ] 20. Client prediction (own avatar) and interpolation (opponent)
- **Checkpoint E** — two browsers play a match over the network

### Phase 6 — UI & polish (coarse)
- [ ] 21. Menu/lobby and result screen
- [ ] 22. Polish pass (scope to be defined at the time)
- **Checkpoint F** — MVP complete

## Dependency Graph

```
1 scene ─► 2 sim loop ─┬─► 3 fish swim ─► 4 dive ───────────────┐
                       └─► 5 fisherman move ─► 6 cast ─► 7 hook ─┤
                                                                 ▼
                                              8 tension ─► 9 reel/drag
                                                   │
                  10 stamina (needs 3, 8) ─► 11 dash
                  12 water gun (needs 3, 5) ─► 13 dodge (needs 12)
                  14 net (needs 7, 10)
                  15 match state (needs 8, 10, 12, 14)
                                   │
                  16 ─► 17 ─► 18 ─► 19 ─► 20 ─► 21 ─► 22
```

Tasks 10–13 are mostly independent of each other once Task 9 is done, but they all
edit `stepMatch` and the config, so they should run **sequentially** and not in
parallel.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Line tension feels bad or unstable | High | Keep it a pure function with unit tests at the edge cases (slack, max, break). Every tuning value lives in config. Checkpoint B is a feel review with a human. |
| Sim state drifts into React/Zustand | High | The sim runner is a plain TS module. React only reads state. Enforce this in review. |
| Hot-seat controls are awkward | Low | Offline only, for testing. The mapping is isolated in one web module. |
| Next.js SSR + three/WebGL | Med | Load the canvas through `next/dynamic` with `ssr: false` in Task 1 (high-risk integration done first). |
| Phase 5 reveals non-serialisable state | Med | `MatchState` is plain JSON data from day one (no classes, no Maps). |
| Prediction complexity (Task 20) | Med | Deferred until authority works. Re-plan at Checkpoint D. |

## Open Questions

1. **Offline controls:** is local hot-seat (two players, one keyboard) acceptable, or
   do you want a simple AI opponent or a role toggle instead? The plan assumes
   hot-seat.
2. **How hooking works:** the plan assumes the fish is hooked automatically when it
   enters the hook radius, with a short grace window where the fish can dodge by
   leaving. An alternative is an explicit "bite/strike" timing mini-game. Which one?
3. **Water gun vs. line:** can the fish shoot while hooked? The plan assumes yes (it
   is comedic and gives the fish a counter).
4. **Rapier:** OK to defer it (Decision 8), even though CLAUDE.md §6 lists it?
