# Implementation Plan: Fish War MVP

Source of truth: `CLAUDE.md` §2–§16 (the `docs/*_SPEC.md` files are empty).
Project init (§15 step 1) is done — commit `1200a6e`.
Detailed tasks with acceptance criteria live in `tasks/todo.md`.

## Overview

Build the 1v1 Fish-vs-Fisherman game in the order from CLAUDE.md §15: an offline,
playable gameplay loop first (Phases 1–4), then multiplayer with server authority
(Phase 5), then UI and polish (Phase 6). Phases 1–4 are done. Phase 5 was
re-planned in detail at Checkpoint D; Phase 6 stays coarse until Checkpoint E.

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

12. **Multiplayer v1 = one room, two seats.** The first connection plays Fish, the
    second plays Fisherman, and a third is told the room is full. No lobby, no
    accounts, no persistence. The team is two (the owner and Claude), so this is the
    smallest thing that proves server authority.
13. **Wire format: JSON over `ws`.** The client sends seq-numbered intent for its own
    role; the server sends full `MatchState` snapshots every tick (small at 30 Hz on a
    LAN). Delta compression only if measurements demand it.
14. **Room logic is pure and socket-free.** `apps/game-server/src/room.ts` holds seats,
    latest inputs and the match; `index.ts` only wires sockets and the tick timer, so
    the rules are unit-tested without a network.
15. **Message parsing lives in `game-core`** (`protocol.ts`): pure, tested, and used by
    both the server (client messages) and the web (server messages). Protocol *types*
    live in `game-types`.
16. **Local-first hosting.** The client connects to `ws://<page host>:8080` (overridable
    with `NEXT_PUBLIC_GAME_SERVER_URL`), so two tabs on one machine work, and so does a
    second machine on the same LAN.
17. **Smoothing: interpolation first, prediction only if needed.** Every entity is
    rendered slightly in the past, between the last two snapshots. Own-avatar
    prediction (Task 20b) is built only if Checkpoint E shows input lag is felt.

### New dependencies (each is justified in its task)

| Package | Where | Why |
|---|---|---|
| `three`, `@types/three` | web | 3D rendering (stack §6) |
| `@react-three/fiber` | web | React renderer for three (stack §6) |
| `zustand` | web | HUD/UI state (stack §6). Added in Task 8, not before |
| `vitest` (dev) | game-server | Unit-test the room logic, same runner as game-core. Task 17 |

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
- [x] 9. Reel and drag
- **Checkpoint B** — the fight on the line is playable

### Phase 3 — Fish vs Fisherman actions
- [x] 10. Fish stamina, sprint, and exhaustion
- [x] 11. Fish dash
- [x] 12. Water gun and fisherman knockout
- [x] 13. Fisherman dodge
- **Checkpoint C** — every §3 ability works

### Phase 4 — Capture & match
- [x] 14. Fishing net captures the fish
- [x] 15. Match state: countdown, timer, escape zone, outcome, restart
- **Checkpoint D** — full offline match, start to finish. **Re-plan Phases 5–6 here.**

### Phase 5 — Multiplayer (re-planned at Checkpoint D)
- [x] 16. Protocol types and message parsing
- [x] 17. Server room: two seats, authoritative tick, snapshots
- [x] 18. Client online mode: send own input, render server snapshots
- [x] 19. Server hardening: input ordering, rate and size limits
- [x] 20. Snapshot interpolation
- [ ] 20b. (Optional) Own-avatar prediction, only if Checkpoint E asks for it
- **Checkpoint E** — two tabs play a full match through the server

### Phase 6 — UI & polish (coarse)
- [x] 21. Menu/lobby and result screen
- 22. Polish pass: [ ] 22a readable characters and sagging line · [ ] 22b sound effects
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
                  16 ─► 17 ─┬─► 18 ─► 20 ─► (20b) ─► 21 ─► 22
                            └─► 19
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
| Prediction complexity | Med | Split out as optional Task 20b; interpolation alone may be enough on a LAN. |
| Client and server configs drift | Med | Both import `DEFAULT_CONFIG` from game-core; the snapshot is the truth either way. |
| Network code leaks into gameplay | High | `stepMatch` stays unaware of sockets; the room and net client only call it or render its output. |

## Open Questions

Resolved with the defaults: hot-seat offline controls; automatic hooking (no grace
window was needed); the fish can shoot while hooked; Rapier deferred. Phase 5 scope
was delegated to Claude at Checkpoint D (Decisions 12–17).

1. **Balance tuning** happens whenever playtesting turns something up, not as a
   separate phase.
