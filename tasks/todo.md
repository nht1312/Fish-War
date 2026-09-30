# Fish War — Task List

See `tasks/plan.md` for architecture decisions, risks, and open questions.

**Standard verification (every task, per CLAUDE.md §14):**
`pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build`. No console errors in
`pnpm --filter @fishwar/web dev`, and no unused imports or unrelated file changes.
Only task-specific checks are listed below.

**Hot-seat controls (offline, see Decision 9)**, finalised as each task lands:
- Fish: `WASD` swim · `Shift` sprint · `C` dive (hold) · `Space` dash · `F` water gun
- Fisherman: `Arrows` move · `Enter` cast / (hold) reel · `[` `]` drag −/+ · `/` net · `.` dodge

---

## Phase 1 — Scene & movement

### - [x] Task 1: Basic 3D scene renders

**Description:** Add three and React Three Fiber, then render a static scene at `/`
a pond (water plane), a dock/shore strip, a placeholder fish mesh, a placeholder
fisherman mesh, lights, and a fixed camera. The canvas loads client-only.

**Acceptance criteria:**
- [ ] `/` shows a full-viewport canvas with a water plane, a dock, a fish mesh, and a fisherman mesh
- [ ] The canvas is loaded through `next/dynamic({ ssr: false })`, and SSR/hydration is clean
- [ ] Scene pieces are small components (`Pond`, `Dock`, `FishMesh`, `FishermanMesh`), and scene dimensions come from named constants

**Verification:**
- [ ] `pnpm build` succeeds
- [ ] Manual: `pnpm --filter @fishwar/web dev`, open `/`, see the scene, check that the browser console has no errors

**Dependencies:** None
**Deps added:** `three`, `@types/three`, `@react-three/fiber` (justified in `plan.md`)
**Files likely touched:** `apps/web/package.json`, `apps/web/app/page.tsx`, `apps/web/src/scene/{GameCanvas,GameCanvasLoader}.tsx`, `apps/web/src/scene/sceneConfig.ts`, `apps/web/src/scene/{Pond,Dock,FishMesh,FishermanMesh}.tsx`
**Scope:** M

### - [x] Task 2: Fixed-tick simulation drives the scene

**Description:** Introduce the pure simulation skeleton and wire it to rendering.
`game-types` gets `Vec3`, `FishState`, `FishermanState`, `MatchState`, `FishInput`,
`FishermanInput`, and `MatchInputs`. `game-core` gets `DEFAULT_CONFIG` (pond size,
tick rate), `createMatch(config)`, `stepMatch(state, inputs, dt)` (it only advances
`tick` and `time`), and a pure `advanceClock(accumulator, frameDt, tickDt)` that
returns the number of ticks to run and the leftover time. The web gets a plain-TS
sim runner, and meshes read positions from the sim state inside `useFrame`.

**Acceptance criteria:**
- [ ] `createMatch` places the fish in the pond and the fisherman on the dock, using positions from config
- [ ] `advanceClock` is unit-tested: zero frame time, a large frame time (capped to max ticks per frame), and the carried remainder
- [ ] Meshes render at the positions from `MatchState`, not hard-coded positions. The sim runner holds the state outside React

**Verification:**
- [ ] `pnpm --filter @fishwar/game-core test` covers `createMatch`, `stepMatch` (tick increments), and `advanceClock`
- [ ] Manual: the scene looks the same as in Task 1, and an optional dev overlay shows the tick counter rising at ~30/s

**Dependencies:** 1
**Files likely touched:** `packages/game-types/src/index.ts`, `packages/game-core/src/{config,match,clock}.ts` + tests, `apps/web/src/sim/simRunner.ts`, `apps/web/src/scene/GameCanvas.tsx`
**Scope:** M

### - [x] Task 3: Fish swims horizontally

**Description:** Keyboard → `FishInput.move` (a 2D vector) → `fishMovement` system:
velocity toward the input direction with acceleration and damping, capped at
`fish.swimSpeed`, and clamped to the pond bounds in XZ. The fish faces its movement
direction.

**Acceptance criteria:**
- [ ] With WASD held, the fish accelerates up to swim speed, and it glides to a stop on release (damping)
- [ ] The fish can never leave the pond bounds. Diagonal input is normalised (no faster diagonals)
- [ ] The fish's facing (yaw) follows its velocity

**Verification:**
- [ ] Unit tests: acceleration toward input, max-speed cap, diagonal normalisation, bounds clamp, damping to zero
- [ ] Manual: the fish swims around the pond with WASD and stops at the edges

**Dependencies:** 2
**Files likely touched:** `packages/game-core/src/systems/fishMovement.ts` + test, `packages/game-core/src/{config,match}.ts`, `apps/web/src/input/keyboard.ts`, `apps/web/src/scene/FishMesh.tsx`
**Scope:** M

### - [x] Task 4: Fish dives and surfaces

**Description:** Holding `C` moves the fish down toward `-POND_DEPTH` at dive speed,
and releasing it lets the fish rise back to the surface. Y is always clamped to
`[-depth, 0]`. The water plane is semi-transparent so the dive is visible.

**Acceptance criteria:**
- [ ] Holding dive lowers the fish at `diveSpeed` until the floor, and releasing it raises the fish at `surfaceSpeed` until `y = 0`
- [ ] Y never leaves `[-depth, 0]`
- [ ] `FishState` exposes `depth` (or `y`) for later systems (the net and the water gun need "is at surface")

**Verification:**
- [ ] Unit tests: descending, rising, clamping at both ends, and an `isAtSurface` helper
- [ ] Manual: the fish visibly goes under the water and comes back

**Dependencies:** 3
**Files likely touched:** `packages/game-core/src/systems/fishMovement.ts` + test, `packages/game-core/src/config.ts`, `apps/web/src/input/keyboard.ts`, `apps/web/src/scene/Pond.tsx`
**Scope:** S

### - [x] Task 5: Fisherman moves on the dock

**Description:** Arrow keys → `FishermanInput.move` → `fishermanMovement` system.
Same kinematic model as the fish, but with its own speed and clamped to the
dock/shore rectangle. The fisherman faces the pond by default.

**Acceptance criteria:**
- [ ] The fisherman moves with the arrow keys at `fisherman.moveSpeed` and cannot leave the dock area
- [ ] Fish and fisherman inputs are independent (hot-seat: both can move at the same time)
- [ ] Movement math is not duplicated. Both systems share a small pure `integrateKinematic` helper

**Verification:**
- [ ] Unit tests: bounds clamp to the dock, speed cap, and the shared helper
- [ ] Manual: both avatars move at the same time on one keyboard

**Dependencies:** 2 (3 for the shared helper)
**Files likely touched:** `packages/game-core/src/systems/{kinematics,fishermanMovement}.ts` + tests, `packages/game-core/src/match.ts`, `apps/web/src/input/keyboard.ts`, `apps/web/src/scene/FishermanMesh.tsx`
**Scope:** M

### Checkpoint A — both avatars controllable
- [ ] All standard verification passes
- [ ] The fish swims and dives, and the fisherman walks the dock, at the same time
- [ ] Review with the human before starting Phase 2

---

## Phase 2 — Rod & line

### - [x] Task 6: Fisherman aims and casts the rod

**Description:** Add a rod to the fisherman: a mesh plus a rod-tip position derived in
core from the fisherman's position and facing. Pressing `Enter` while the line is
`idle` casts: the hook flies to a landing point in front of the fisherman at
`castDistance`, clamped to the pond, and the line enters phase `cast`. Pressing
`Enter` again while in `cast` reels the empty hook back to `idle`. The line is drawn
from the rod tip to the hook.

**Acceptance criteria:**
- [ ] `LineState` is added (`phase`, `hookPosition`, `length`, `maxLength`) with `idle → cast → idle` transitions in a pure `line` system
- [ ] The hook lands at a deterministic point inside the pond, never on land
- [ ] The rod and the line render, and the line visibly connects the rod tip to the hook

**Verification:**
- [ ] Unit tests: rod-tip derivation, cast landing point (including clamping), and the phase transitions
- [ ] Manual: walk, cast, see the hook land in the water, retrieve it

**Dependencies:** 5
**Files likely touched:** `packages/game-types/src/index.ts`, `packages/game-core/src/systems/line.ts` + test, `packages/game-core/src/config.ts`, `apps/web/src/scene/{Rod,FishingLine}.tsx`
**Scope:** M

### - [x] Task 7: Fish gets hooked; line length constrains the fish

**Description:** In phase `cast`, a fish that enters `hookRadius` of the hook becomes
`hooked` (see Open Question 2). While hooked, the line runs from the rod tip to the
fish, and the fish cannot move farther than `line.length` from the rod tip: its
position is projected back onto the sphere and its outward velocity removed.

**Acceptance criteria:**
- [ ] A fish inside the hook radius transitions the line to `hooked`, and a fish outside does not
- [ ] While hooked, `distance(fish, rodTip) <= line.length` always holds
- [ ] The line renders to the fish while hooked

**Verification:**
- [ ] Unit tests: the hook trigger boundary, the length constraint projection, and inward movement staying unconstrained
- [ ] Manual: cast near the fish, swim into the hook, feel the fish get tethered

**Dependencies:** 4, 6
**Files likely touched:** `packages/game-core/src/systems/line.ts` + test, `packages/game-core/src/match.ts`, `apps/web/src/scene/FishingLine.tsx`
**Scope:** S–M

### - [x] Task 8: Line tension and line break

**Description:** Add a pure `computeTension` function. Tension rises when the fish
pulls outward at full line length (proportional to the outward component of the fish's
intended movement), eases to 0 when the line is slack, and decays over time. When
`tension >= breakStrength` for longer than `breakGraceSeconds`, the line breaks and
`MatchState.outcome = { winner: "fish", reason: "line-broken" }`. Add Zustand for the
HUD and show a tension bar.

**Acceptance criteria:**
- [ ] Tension is 0 when the line is slack, rises when the fish pulls at full length, and never goes negative
- [ ] Sustained over-tension breaks the line and sets the Fish-wins outcome. A brief spike under the grace time does not
- [ ] The HUD tension bar reflects `line.tension / breakStrength`, is fed from the sim through Zustand (throttled), and has no gameplay logic in React

**Verification:**
- [ ] Unit tests: slack, rising, decay, break after grace, no break on a short spike
- [ ] Manual: hook the fish, swim hard away, watch the bar fill until the line snaps

**Dependencies:** 7
**Deps added:** `zustand`, for HUD state (stack §6)
**Files likely touched:** `packages/game-core/src/systems/tension.ts` + test, `packages/game-types/src/index.ts` (`MatchOutcome`), `apps/web/package.json`, `apps/web/src/state/hudStore.ts`, `apps/web/src/ui/TensionBar.tsx`
**Scope:** M

### - [x] Task 9: Reel and drag

**Description:** Holding `Enter` while hooked reels: it shortens `line.length` at
`reelSpeed`, pulling the fish in and adding tension when the fish resists. `[` and `]`
adjust `drag` in steps, within `[minDrag, maxDrag]`. When tension exceeds the drag
threshold, the line pays out: length grows toward `maxLength`, which relieves tension
instead of letting it climb to break. Rod force is a constant that scales the reel's
contribution.

**Acceptance criteria:**
- [ ] Reeling shortens the line (never below `minLength`) and pulls the fish closer
- [ ] With drag below `breakStrength`, a steadily pulling fish takes line out instead of breaking it, until `maxLength` is reached
- [ ] Drag is adjustable, clamped, and shown on the HUD

**Verification:**
- [ ] Unit tests: reel shortening, minimum length, drag pay-out, drag clamping, and break once the line is at max length
- [ ] Manual: a tug-of-war. Low drag lets the fish run, high drag risks a snap

**Dependencies:** 8
**Files likely touched:** `packages/game-core/src/systems/{line,tension}.ts` + tests, `packages/game-core/src/config.ts`, `apps/web/src/input/keyboard.ts`, `apps/web/src/ui/TensionBar.tsx`
**Scope:** M

### Checkpoint B — the fight on the line is playable
- [ ] All standard verification passes
- [ ] Cast → hook → tug-of-war → line break works end-to-end
- [ ] **Feel review with the human:** tune `DEFAULT_CONFIG` before building on it

---

## Phase 3 — Fish vs Fisherman actions

### - [ ] Task 10: Fish stamina, sprint, and exhaustion

**Description:** `FishState.stamina` runs from 0 to `maxStamina`. Holding `Shift`
sprints (a speed multiplier) and drains stamina. Pulling against the line drains it in
proportion to tension. Resting regenerates it. At 0 the fish is exhausted: the line
reaching `exhausted` while hooked gives `outcome = { winner: "fisherman", reason:
"fish-exhausted" }`. Sprinting is impossible with no stamina.

**Acceptance criteria:**
- [ ] Sprinting increases speed and drains stamina. Regeneration happens only when not sprinting or pulling
- [ ] Stamina reaching 0 while hooked sets the Fisherman-wins outcome
- [ ] A HUD stamina bar is shown

**Verification:**
- [ ] Unit tests: drain, regen, clamping, no sprint at 0, and the exhaustion outcome only while hooked
- [ ] Manual: sprint until empty, and wear the fish out on the line

**Dependencies:** 3, 8
**Files likely touched:** `packages/game-core/src/systems/stamina.ts` + test, `packages/game-core/src/{config,match}.ts`, `apps/web/src/ui/StaminaBar.tsx`, `apps/web/src/input/keyboard.ts`
**Scope:** M

### - [ ] Task 11: Fish dash

**Description:** `Space` triggers a short burst in the facing direction: a velocity
impulse, a stamina cost, and `dashCooldown`. While hooked, a dash causes a tension
spike (a key line-break tool). Cooldowns are ticked in core and never trusted from
input.

**Acceptance criteria:**
- [ ] A dash applies the impulse, deducts stamina, and starts the cooldown. A dash during cooldown or with insufficient stamina does nothing
- [ ] A dash while hooked produces a measurable tension spike
- [ ] Cooldown timing is based on sim time

**Verification:**
- [ ] Unit tests: the impulse, the cooldown gate, the stamina gate, and the tension spike
- [ ] Manual: dash around, and dash-snap the line

**Dependencies:** 10
**Files likely touched:** `packages/game-core/src/systems/dash.ts` + test, `packages/game-core/src/{config,match}.ts`, `apps/web/src/input/keyboard.ts`
**Scope:** S–M

### - [ ] Task 12: Water gun and fisherman knockout

**Description:** When the fish is at the surface, `F` fires a water projectile toward
the fisherman. Projectiles live in `MatchState.projectiles` (plain data), move
ballistically in core, and on hit reduce `FishermanState.balance`. Balance regenerates
slowly. At 0, the fisherman is knocked out: `outcome = { winner: "fish", reason:
"fisherman-knocked-out" }`. The shot has a cooldown. Fisherman hits stagger the reel
(no reeling for `staggerSeconds`).

**Acceptance criteria:**
- [ ] Firing works only at the surface and off cooldown. Projectiles travel and expire after range or time
- [ ] A hit reduces balance and staggers the reel. Balance at 0 sets the Fish-wins knockout outcome
- [ ] Projectiles render, and a HUD balance bar is shown

**Verification:**
- [ ] Unit tests: the fire gates, projectile integration, hit detection, the balance/KO outcome, and stagger blocking the reel
- [ ] Manual: surface, spray the fisherman, knock them out

**Dependencies:** 4, 5, 9
**Files likely touched:** `packages/game-core/src/systems/waterGun.ts` + test, `packages/game-types/src/index.ts`, `packages/game-core/src/{config,match}.ts`, `apps/web/src/scene/Projectiles.tsx`, `apps/web/src/ui/BalanceBar.tsx`
**Scope:** M–L (split the render/HUD part off if it grows)

### - [ ] Task 13: Fisherman dodge

**Description:** `.` performs a short sidestep dash in the move direction, or sideways
by default, with invulnerability frames against projectiles for `dodgeIFrameSeconds`
and a cooldown.

**Acceptance criteria:**
- [ ] A dodge moves the fisherman quickly and stays inside the dock bounds
- [ ] Projectiles that overlap during i-frames do not hit
- [ ] The cooldown gates repeated dodges

**Verification:**
- [ ] Unit tests: the displacement, bounds, i-frames ignoring hits, and the cooldown
- [ ] Manual: dodge water gun shots

**Dependencies:** 12
**Files likely touched:** `packages/game-core/src/systems/dodge.ts` + test, `packages/game-core/src/{config,match}.ts`, `packages/game-core/src/systems/waterGun.ts`, `apps/web/src/input/keyboard.ts`
**Scope:** S–M

### Checkpoint C — every §3 ability works
- [ ] All standard verification passes
- [ ] Fish: move, swim, sprint, dash, dive, water gun, break line, exhaust. Fisherman: move, dodge, cast, rod, drag, reel
- [ ] Review with the human

---

## Phase 4 — Capture & match

### - [ ] Task 14: Fishing net captures the fish

**Description:** `/` swings the net, with a cooldown. It succeeds if the fish is
within `netRange` of the fisherman **and** is at or near the surface (`y >=
-netDepth`). The fish does not have to be hooked, but in practice it must be reeled
in. On success, `outcome = { winner: "fisherman", reason: "captured" }`. A miss
triggers the cooldown (a comedic whiff).

**Acceptance criteria:**
- [ ] The net captures only when the fish is within range and depth. Otherwise it misses and starts the cooldown
- [ ] A capture sets the Fisherman-wins outcome
- [ ] A net swing animation or indicator renders

**Verification:**
- [ ] Unit tests: in range, out of range, too deep, the cooldown, and the outcome
- [ ] Manual: reel the fish in and net it, then whiff on a diving fish

**Dependencies:** 7, 10
**Files likely touched:** `packages/game-core/src/systems/net.ts` + test, `packages/game-core/src/{config,match}.ts`, `apps/web/src/scene/Net.tsx`, `apps/web/src/input/keyboard.ts`
**Scope:** M

### - [ ] Task 15: Match state — countdown, timer, escape zone, outcome, restart

**Description:** Add `MatchState.phase: countdown | playing | ended`, with countdown
seconds, a `matchDuration` timer, and an **escape zone** (a volume at the far pond
edge). A single `resolveOutcome` function consolidates every §4 condition: line
broken, fish escapes (enters the zone while unhooked), fisherman KO, timer expires (Fish
wins), fish exhausted, capture. The sim freezes when the match ends. The HUD shows the
timer and a minimal result overlay, and `R` restarts.

**Acceptance criteria:**
- [ ] Inputs are ignored during the countdown. The timer counts down during play, and reaching 0 gives Fish wins by timeout
- [ ] Every outcome from §4 goes through `resolveOutcome`, with a deterministic priority when two happen on the same tick (documented), and the state stops advancing after `ended`
- [ ] The escape zone is rendered, and restart gives a fresh `createMatch`

**Verification:**
- [ ] Unit tests: phase transitions, timeout, escape (hooked vs. unhooked), and same-tick priority
- [ ] Manual: play several full matches reaching different outcomes

**Dependencies:** 8, 10, 12, 14
**Files likely touched:** `packages/game-core/src/systems/outcome.ts` + test, `packages/game-core/src/match.ts`, `packages/game-types/src/index.ts`, `apps/web/src/scene/EscapeZone.tsx`, `apps/web/src/ui/{MatchTimer,ResultOverlay}.tsx`
**Scope:** M–L (split the UI part into 15b if needed)

### Checkpoint D — full offline match
- [ ] All standard verification passes
- [ ] A complete hot-seat match can end in each of the 6 §4 outcomes
- [ ] `MatchState` round-trips through `JSON.stringify`/`JSON.parse` unchanged (network-ready)
- [ ] **Re-plan Phases 5–6 with the human** before continuing

---

## Phase 5 — Multiplayer (coarse, re-plan at Checkpoint D)

### - [ ] Task 16: Network protocol types and message validation
Client→server: `join`, `input` (seq-numbered `FishInput | FishermanInput`). Server→client:
`welcome` (role), `snapshot` (tick + `MatchState`), `matchEnded`. Hand-written type
guards in `game-types` (no schema-library dependency unless justified).
**AC:** the messages are typed; the guards reject malformed input (unit-tested). **Deps:** 15

### - [ ] Task 17: Server room with an authoritative tick
The server pairs two connections into a room, assigns Fish/Fisherman, runs
`stepMatch` at `TICK_RATE` with the latest input per player, and broadcasts snapshots.
Replace the echo placeholder.
**AC:** two WS clients get roles and receive advancing snapshots; the room is cleaned up on disconnect; room logic is tested without sockets. **Deps:** 16

### - [ ] Task 18: Client online mode
The web connects, sends inputs for its role only, and renders server snapshots (no
prediction yet). Offline hot-seat stays available.
**AC:** two browsers play a match with the server deciding every outcome. **Deps:** 17

### - [ ] Task 19: Server input validation and rate limiting
Clamp and normalise movement vectors, drop out-of-order or excess input messages, and
ignore actions the role doesn't own. Cooldowns and stamina are already server-side via
`stepMatch`.
**AC:** tests show that forged or oversized inputs cannot speed up an avatar or trigger foreign actions. **Deps:** 17

### - [ ] Task 20: Prediction and interpolation
Predict the local avatar with the shared `stepMatch` and reconcile on snapshots (seq
ack). Interpolate the remote avatar between snapshots.
**AC:** movement feels responsive under 100 ms of artificial latency; no rubber-banding when latency is low. **Deps:** 18, 19

### Checkpoint E — networked match
- [ ] Two browsers on different machines complete a match; the server is the only authority

---

## Phase 6 — UI & polish (coarse)

### - [ ] Task 21: Menu/lobby and result screen
Choose offline or online, a waiting-for-opponent state, role display, and a result
screen with a rematch option. **Deps:** 18

### - [ ] Task 22: Polish pass
Scope to be defined with the human (placeholder art, juice, sound). **Deps:** 21

### Checkpoint F — MVP complete
- [ ] Every item in CLAUDE.md §2 exists, and §14 Definition of Done holds
