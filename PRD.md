# Daily Habits Tracker (v2) — Hybrid Counter+

**Version:** 2.0 | 2026-04-26
**Platform:** React Native — Expo (iPhone, Android, and web from one codebase)
**Purpose:** Validate the new PRD #59 knowledge file system end-to-end. v1 shipped successfully but burned ~$31 in e2e debugging the `@gorhom/bottom-sheet` web bundle crash and a flaky Maestro swipe-to-delete loop. v2 must hit those same gotchas cleanly on the first pass thanks to the new knowledge files.

---

## Overview

A hybrid (iOS + Android + web) habit tracker built with Expo and Expo Router. Users add named habits, mark them done for the day, see a 7-day completion grid, and delete habits they no longer want.

Same codebase produces an iPhone build, an Android build, AND a web build deployed to Vercel. All three targets ship as equal-citizen first-class outputs. Tested with Maestro on both native variants AND with Playwright on the web variant.

**Value prop:** Demonstrate that the new PRD #59 knowledge file system (`hybrid-web-platform-guards.md`, `expo-web-export-verification.md`, `maestro-debugging-patterns.md`) eliminates the failure modes that cost ~$31 in e2e debugging during v1.

**v2 specifically validates:**
- Pre-flight web bundle scan catches `@gorhom/bottom-sheet` BEFORE first Playwright run
- Maestro swipe-to-delete works on the first or second iteration (not 5+)
- Both iOS AND Android Maestro tests run in the same build
- e2e phase total cost is **<$15** (vs ~$31 in v1)
- No web bundle crash on imports that lack web support

---

## Platform

A React Native application built with Expo and Expo Router. Same TypeScript codebase produces three deployable outputs.

| Field | Value |
|---|---|
| **Framework** | Expo SDK with Expo Router |
| **Language** | TypeScript |
| **Targets** | iOS, Android, web (all three from one codebase) |
| **State** | React `useState` + AsyncStorage on native, in-memory only on web |
| **Persistence** | AsyncStorage (native) / in-memory (web) |
| **Native testing** | Maestro on BOTH iOS and Android |
| **Web testing** | Playwright |
| **Web deploy** | Vercel (Expo web export → static hosting) |
| **Native deploy** | GitHub repository (artifact source) |

---

## Key Principles

1. **All three targets ship together** — iPhone, Android, web are equal first-class outputs
2. **AsyncStorage on native, in-memory on web** — habits persist across launches on phone, reset per browser session
3. **Web-safe imports only** — every native-only library MUST have a `Platform.OS === 'web'` guard or a `.native.tsx` / `.web.tsx` file split
4. **Native + web APIs visible** — `Platform.OS` shows `ios`, `android`, or `web`; readout updates per variant
5. **Maestro tests run on BOTH iOS and Android** — not iOS-only

---

## User Stories

### Habit Management (all three variants)

- As a user, I can **add a habit** by typing a name and tapping "Add"
  - [ ] Empty habit names are rejected (button disabled when input is blank)
  - [ ] New habits appear at the top of the list
  - [ ] Maximum 50 character habit name (longer names truncated with ellipsis in display)

- As a user, I can **mark a habit done for today** by tapping its row
  - [ ] Tapped row highlights and shows a checkmark for today
  - [ ] Tapping again un-marks (toggle behavior)
  - [ ] The 7-day grid for that row updates immediately

- As a user, I can **delete a habit**
  - [ ] On native: swipe-left reveals a Delete button; tap to confirm
  - [ ] On web: an inline `[Delete]` button appears in each row (no swipe gesture)
  - [ ] Deletion removes the habit from storage and the list

- As a user, I can **see my 7-day completion grid** for each habit
  - [ ] Last 7 days shown as 7 colored squares per row
  - [ ] Filled square = done that day; empty square = not done
  - [ ] Today's square is highlighted with a border

### Platform Readout (per-variant, bottom of screen)

- As a user, I can **see which variant I'm running**
  - [ ] Card displays `Platform.OS` (`ios` / `android` / `web`)
  - [ ] Card displays `Platform.Version` for native variants
  - [ ] Card displays count of habits stored
  - [ ] On web, the card shows "ephemeral storage" warning

---

## Features (Single Phase)

### Phase 1: Habits Tracker

1. **Root layout** — `app/_layout.tsx`
   - [ ] Wraps the app in `SafeAreaProvider` AND `GestureHandlerRootView` (native only — see knowledge file)
   - [ ] Sets up Expo Router stack

2. **Single screen** — `app/index.tsx`
   - [ ] Wraps content in `SafeAreaView`
   - [ ] Vertical layout: title, add-habit row, habit list, platform card

3. **Add habit row** — `components/AddHabitRow.tsx`
   - [ ] `TextInput` for habit name
   - [ ] `Pressable` "Add" button (disabled when input blank)
   - [ ] Clears input on successful add

4. **Habit list** — `components/HabitList.tsx`
   - [ ] Renders a list of `HabitRow` components
   - [ ] Empty state when no habits added yet

5. **Habit row** — `components/HabitRow.tsx`
   - [ ] Habit name on left
   - [ ] 7-day grid on right
   - [ ] Native: swipe-left reveals Delete button (uses `react-native-gesture-handler` Swipeable)
   - [ ] Web: inline `[Delete]` button replaces swipe (Platform.OS === 'web' branch)
   - [ ] Tap on row toggles today's completion

6. **Platform info card** — `components/PlatformInfoCard.tsx`
   - [ ] Reads `Platform.OS`, `Platform.Version`, habit count
   - [ ] Shows storage warning on web

7. **Storage layer** — `lib/storage.ts`
   - [ ] On native: AsyncStorage-backed read/write of habits + completion records
   - [ ] On web: in-memory Map (no AsyncStorage import on web — use `Platform.OS` guard or `.web.ts` shim)

---

## CRITICAL — PRD #59 Knowledge Files Apply

Read these knowledge files before doing the e2e phase:

- `prompts/knowledge/hybrid-web-platform-guards.md` — Every native-only import (`@gorhom/bottom-sheet`, `react-native-gesture-handler` Swipeable, `expo-haptics`, native-only AsyncStorage paths) needs a `Platform.OS` guard OR a `.web.ts(x)` file split. Run `expo export --platform web` LOCALLY before deploying to Vercel.
- `prompts/knowledge/expo-web-export-verification.md` — A passing `expo export --platform web` is the gating signal for the web variant. Bundle errors there will surface as Playwright failures otherwise.
- `prompts/knowledge/maestro-debugging-patterns.md` — Soft keyboard hides target elements; use `hideKeyboard:` between input and tap. Swipe-to-delete on iOS Simulator needs `swipe: { from: { id: "..." }, direction: LEFT }` not raw coordinates.

These knowledge files were authored specifically because v1 hit each of these failure modes. v2 should NOT repeat them.

---

## Project Structure

```
src/
  app/
    _layout.tsx            # SafeAreaProvider + GestureHandlerRootView
    index.tsx              # Main screen
  components/
    AddHabitRow.tsx
    HabitList.tsx
    HabitRow.tsx           # Has Platform.OS === 'web' branch for delete UI
    PlatformInfoCard.tsx
  lib/
    storage.ts             # Or storage.native.ts + storage.web.ts split
    types.ts               # Habit, CompletionRecord
```

---

## Technology Stack

- **Framework:** Expo SDK with Expo Router (TypeScript template via `npx create-expo-app@latest --template blank-typescript`)
- **UI primitives:** React Native (`View`, `Text`, `Pressable`, `TextInput`, `FlatList`)
- **Web bridge:** `react-native-web` (REQUIRED in dependencies)
- **Safe area:** `react-native-safe-area-context`
- **Gesture handler:** `react-native-gesture-handler` (Swipeable on native; web uses inline button)
- **Storage:** `@react-native-async-storage/async-storage` (native only — web uses in-memory shim)
- **Native testing:** Maestro (iOS AND Android)
- **Web testing:** Playwright
- **Web deploy:** Vercel

---

## Testing Requirements

### Maestro Flows (BOTH iOS and Android, 7-min fail-soft cap)

1. **`add_and_complete_habit`** — Core happy path
   - [ ] Launch app
   - [ ] Tap `add-habit-input`, type "Drink water", `hideKeyboard:`
   - [ ] Tap `add-habit-button`
   - [ ] Assert `habit-row-0` is visible and contains "Drink water"
   - [ ] Tap `habit-row-0` to mark complete
   - [ ] Assert `habit-row-0-today-cell` shows the filled state

2. **`delete_habit_swipe`** — Delete via swipe (native)
   - [ ] Launch app, add "Test habit"
   - [ ] Swipe left on `habit-row-0`
   - [ ] Tap `habit-row-0-delete-button`
   - [ ] Assert habit is no longer visible

3. **`platform_info_native`** — Native platform readout
   - [ ] Launch app
   - [ ] Assert `platform-info-card` is visible
   - [ ] Assert `platform-os` field contains "ios" (iOS run) or "android" (Android run)

### Playwright Flows (web variant)

1. **`habits.spec.ts`** — Add and complete a habit in the browser
   - [ ] Navigate to deployed web URL
   - [ ] Fill `[data-testid="add-habit-input"]` with "Drink water"
   - [ ] Click `[data-testid="add-habit-button"]`
   - [ ] Assert `[data-testid="habit-row-0"]` contains "Drink water"
   - [ ] Click `[data-testid="habit-row-0"]` and assert today cell is filled

2. **`delete-inline.spec.ts`** — Delete via inline button (web only)
   - [ ] Add a habit
   - [ ] Click `[data-testid="habit-row-0-delete-button"]` (the WEB inline button, NOT swipe)
   - [ ] Assert habit is removed

3. **`platform-info.spec.ts`** — Web platform readout
   - [ ] Navigate to deployed web URL
   - [ ] Assert `[data-testid="platform-info-card"]` is visible
   - [ ] Assert `[data-testid="platform-os"]` contains "web"

### Test ID Conventions

All interactive elements must have BOTH `testID` (Maestro on native) AND `data-testid` (Playwright on web). Expo's `react-native-web` exposes `testID` as `data-testid` automatically — verify this.

---

## Quality Requirements

- Touch targets minimum 44pt for native and 44px for web
- Safe area handling for the iPhone notch and home indicator (native only)
- No `@gorhom/bottom-sheet`, no native-only Swipeable, no native-only AsyncStorage import path reaching the web bundle
- `expo export --platform web` MUST run cleanly locally BEFORE Vercel deploy
- Maestro test execution capped at 420 seconds per platform with fail-soft on cap-hit
- Vercel deploy and GitHub push run independently of native test outcome
- Pre-flight bundle scan runs BEFORE first Playwright run (per PRD #59 knowledge)

---

## Deployment

| Variant | Artifact | Deploy target |
|---|---|---|
| iOS | Expo iOS bundle (Maestro-tested via Expo Go for the smoke test) | GitHub repo + (eventually) TestFlight via EAS |
| Android | Expo Android bundle (Maestro-tested via Expo Go for the smoke test) | GitHub repo + (eventually) Play Console via EAS |
| Web | `expo export --platform web` static export | Vercel preview URL |

For the smoke test, Vercel deploy of the web variant is the critical shipping path. Native variants validate via Maestro (iOS Simulator + Android Emulator).

**v2 expectation:** Both iOS Maestro AND Android Maestro run in the same build. Vercel deploy + GitHub push run regardless of Maestro outcome. Step 6 captures both URLs.

---

## Success Criteria

- [ ] All habit user stories pass on iOS variant
- [ ] All habit user stories pass on Android variant
- [ ] All habit user stories pass on web variant
- [ ] All platform readout acceptance criteria pass per variant
- [ ] `package.json` lists `expo`, `expo-router`, `react-native-safe-area-context`, `react-native-web`, `react-native-gesture-handler`, AND `@react-native-async-storage/async-storage`
- [ ] `.maestro/` directory contains `add_and_complete_habit.yaml`, `delete_habit_swipe.yaml`, AND `platform_info_native.yaml`
- [ ] `tests/web/` directory contains `habits.spec.ts`, `delete-inline.spec.ts`, AND `platform-info.spec.ts`
- [ ] Vercel deploy succeeds and the web variant URL is reachable
- [ ] GitHub repo is created with the source code
- [ ] Step 6 build report includes BOTH the Vercel URL AND the GitHub repo URL
- [ ] Step 6 includes `subPlatformsTested: ["ios", "android", "web"]` annotation

### v2-specific validation (PRD #59 knowledge file ROI)

- [ ] e2e phase total cost is **<$15** (vs ~$31 in v1)
- [ ] Web bundle does NOT crash on `@gorhom/bottom-sheet` (because we don't import it on web — or don't use it at all)
- [ ] Maestro swipe-to-delete passes in **≤2 iterations** (vs 5+ in v1)
- [ ] Pre-flight `expo export --platform web` runs locally BEFORE first Playwright invocation
- [ ] No web bundle errors surfaced via Playwright that could have been caught by local export

---

## Known Gotchas

**CRITICAL — read this section twice:** v1 burned ~$31 in e2e debugging the failure modes documented in PRD #59's knowledge files. v2 should NOT hit them.

**CRITICAL:** Web variant must NOT import `@gorhom/bottom-sheet` (or any native-only modal/sheet library) without a `Platform.OS === 'web'` branch. The library throws on web bundle creation.

**CRITICAL:** Web delete UX is an inline `[Delete]` button, NOT a swipe gesture. `react-native-gesture-handler` Swipeable on web is unreliable. Use the `Platform.OS === 'web'` branch in `HabitRow.tsx`.

**CRITICAL:** Storage module needs a `.web.ts` shim or `Platform.OS` guard. AsyncStorage on web triggers warnings and is ephemeral anyway.

**CRITICAL:** `react-native-gesture-handler` requires `GestureHandlerRootView` wrapping the app on native (added in `_layout.tsx`).

**CRITICAL:** Run `npx expo export --platform web` LOCALLY before triggering the Vercel deploy. A passing local web export is the gating signal — Playwright failures from web bundle errors are silent traps.

**CRITICAL:** Maestro flows for `add_and_complete_habit` MUST include `hideKeyboard:` after `inputText:` and before `tapOn: id: add-habit-button`. The soft keyboard occludes the button on iOS Simulator.

**CRITICAL:** Maestro `swipe-to-delete` should use named-element swipe syntax (`swipe: { from: { id: "habit-row-0" }, direction: LEFT }`), not raw pixel coordinates that drift between simulator versions.

**CRITICAL:** Vercel deploys the `dist/` static export, not the source repo. The deploy command should target the export directory directly.

**CRITICAL:** Use bounded `until`-loop polling for native build readiness (per PRD #56), not `ScheduleWakeup`.
