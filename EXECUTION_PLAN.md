# EXECUTION_PLAN.md — Daily Habits Tracker v2

**Build ID:** `daily-habits-v2-20260426221635`
**Platform:** `native` (hybrid)
**Sub-platforms:** `["ios", "android", "web"]` (default for native — PRD #54 HYBRID-003)
**Total tasks:** 22 (preserved from extract phase, no modifications)

---

## 1. Executive Summary

Build a **hybrid Expo app** — single TypeScript codebase produces an iOS bundle, an Android bundle, and a web bundle deployed to Vercel. Users add named habits, mark them done for the day, see a 7-day completion grid, and delete habits. Deletion is platform-branched: native uses `react-native-gesture-handler` Swipeable; web uses an inline `[Delete]` button.

This build's purpose is to **validate the PRD #59 knowledge file system** (`hybrid-web-platform-guards.md`, `expo-web-export-verification.md`, `maestro-debugging-patterns.md`). v1 burned ~$31 in e2e debugging the `@gorhom/bottom-sheet` web crash and a flaky Maestro swipe-delete. v2 must avoid both on the first pass.

**Key tech choices:**

- Expo SDK + Expo Router (TypeScript blank template)
- `react-native-web` for the Expo web target (REQUIRED — Vercel deploy fails without it)
- `react-native-safe-area-context` + `react-native-gesture-handler`
- `@react-native-async-storage/async-storage` (native) + in-memory shim (web) via `.native.ts` / `.web.ts` file split
- Maestro on **both** iOS Simulator and Android Emulator
- Playwright against the deployed/exported web bundle
- Vercel for the web variant (`vercel deploy dist/ --prod`)
- GitHub repo push for native source artifacts

**Note:** This PRD is intentionally lightweight — no SQLite, no Reanimated, no maps, no NativeWind, no bottom sheets. State is `useState` + AsyncStorage on native, in-memory Map on web. The complexity lives in the **platform splits**, not in the feature surface.

---

## 2. Batches

### Batch 0 — Foundation & First-Launch Verification

**Tasks:** #1, #2, #5, #6
**Builds:** Expo project skeleton, all hybrid dependencies, root layout, first iOS simulator launch.

- #1 [BUILD] Initialize Expo + TypeScript + Expo Router project
- #2 [BUILD] Install hybrid platform dependencies (`react-native-web`, `react-dom`, `@expo/metro-runtime`, `react-native-safe-area-context`, `react-native-gesture-handler`, `@react-native-async-storage/async-storage`)
- #5 [BUILD] Root layout with `SafeAreaProvider` + `GestureHandlerRootView`
- #6 [BUILD] iOS Simulator Launch Verification

**Validation checkpoint:**
- `npx tsc --noEmit` clean
- App launches on iOS Simulator without crash (screenshot to verify visually)
- App launches on Android Emulator without crash
- `npx expo start --web` loads without bundle errors

---

### Batch 1 — Data Layer

**Tasks:** #3, #4
**Builds:** Type definitions, storage abstraction with `.native.ts` / `.web.ts` split.

- #3 [BUILD] Define data types (`Habit`, `CompletionRecord`)
- #4 [BUILD] Storage layer with `.web.ts` / `.native.ts` split — AsyncStorage on native, in-memory `Map` on web. **No `AsyncStorage` import path may reach the web bundle** (PRD #59 knowledge: `hybrid-web-platform-guards.md`).

**Validation checkpoint:**
- `npx tsc --noEmit` clean
- `npx expo export --platform web` succeeds (verifies storage shim doesn't drag AsyncStorage into web bundle — PRD #59)

---

### Batch 2 — Core UI Components

**Tasks:** #7, #9, #10
**Builds:** Add row, list w/ empty state, platform info card.

- #7 [BUILD] `AddHabitRow` component (`TextInput` + `Pressable` "Add" button, disabled when input blank)
- #9 [BUILD] `HabitList` component with empty state
- #10 [BUILD] `PlatformInfoCard` component (`Platform.OS`, `Platform.Version`, habit count, web ephemeral-storage warning)

**Validation checkpoint:**
- `npx tsc --noEmit` clean
- `npx eslint . --ext .ts,.tsx` clean
- iOS Simulator: components render, "Add" button disabled state visible (screenshot)
- Android Emulator: components render
- `npx expo export --platform web`: succeeds

---

### Batch 3 — HabitRow Platform Split + Main Screen Wiring

**Tasks:** #8, #11
**Builds:** The most platform-sensitive component (swipe vs inline-delete branch) + main screen integration.

- #8 [BUILD] `HabitRow` with swipe-delete (native) / inline button (web). Uses `Platform.OS === 'web'` branch — inline `[Delete]` button on web replaces `Swipeable`. Each row exposes `testID="habit-row-N"` AND `data-testid` (Expo's `react-native-web` maps `testID` → `data-testid` automatically; verify).
- #11 [BUILD] Main screen (`app/index.tsx`) wiring `AddHabitRow`, `HabitList` (`HabitRow` × N), `PlatformInfoCard` inside `SafeAreaView`.

**Validation checkpoint:**
- `npx tsc --noEmit` clean
- `npx eslint . --ext .ts,.tsx` clean
- iOS Simulator: add habit, mark done, swipe-delete works (screenshot each step)
- Android Emulator: same flow works
- Web (`npx expo start --web`): add habit, mark done, **inline [Delete]** appears (NOT swipe), and clicking it removes the row

---

### Batch 4 — Pre-flight Web Export + Test Infrastructure

**Tasks:** #12, #13, #14
**Builds:** The PRD #59 gating signal + native and web test scaffolding.

- #12 [BUILD] Pre-flight web bundle verification (`npx expo export --platform web`). **This is the gating signal** — if it fails, do NOT proceed to Playwright. Per PRD #59 `expo-web-export-verification.md`: a passing local web export catches `@gorhom/bottom-sheet`-style imports BEFORE Playwright surfaces silent bundle errors as flaky test failures.
- #13 [BUILD] Set up Maestro and write native test flows for iOS + Android. Files (PRD #54 HYBRID-003 — both `ios` and `android` are in scope, so suffix per-platform):
  - `.maestro/add_and_complete_habit-ios.yaml` + `-android.yaml`
  - `.maestro/delete_habit_swipe-ios.yaml` + `-android.yaml`
  - `.maestro/platform_info_native-ios.yaml` + `-android.yaml`
  - Per PRD #59 `maestro-debugging-patterns.md`: `hideKeyboard:` between `inputText:` and the "Add" tap; named-element swipe (`swipe: { from: { id: "habit-row-0" }, direction: LEFT }`), NOT raw pixel coordinates.
- #14 [BUILD] Set up Playwright and write web test files under `tests/web/`:
  - `tests/web/habits.spec.ts`
  - `tests/web/delete-inline.spec.ts` (asserts inline button, NOT swipe)
  - `tests/web/platform-info.spec.ts`
  - Same `data-testid` selectors as Maestro `testID`s (assertion equivalence per PRD #54).

**Validation checkpoint:**
- `npx expo export --platform web` exits 0 and emits `dist/`
- `dist/` is non-empty and contains `index.html`
- Maestro YAML files lint with `maestro test --validate` (no execution yet)
- Playwright specs typecheck

---

### Batch 5 — Sub-platform Preflight Verification (manifest wrapper)

**Tasks:** *(no existing tasks — this batch is the wrapper-routed verify pass; if the executor needs explicit task entries it can derive them from `subPlatforms`)*

Per PRD #55 PREFLIGHT-WIRE-002, each sub-platform is verified through the `manifest preflight <sub>` CLI wrapper, NOT raw `xcrun` / `xcodebuild` / `vercel whoami`:

- `[VERIFY] ios preflight (timeout 5m, fail-soft)` — `npx manifest preflight ios`, `maxWaitSeconds: 300`
- `[VERIFY] android preflight (timeout 5m, fail-soft)` — `npx manifest preflight android`, `maxWaitSeconds: 300`
- `[VERIFY] web preflight (timeout 5m, fail-soft)` — `npx manifest preflight web`, `maxWaitSeconds: 300`

On non-zero exit, the wrapper records `parkReason: <stderr>` and trims that sub-platform from the build's `subPlatforms`. The build continues with whatever remains. Do NOT inline raw `xcrun` / `vercel whoami` — that bypasses fail-soft semantics and can device-flow on uninitialized hosts.

---

### Batch 6 — Test Execution (parallel `[TEST]` tasks, fail-soft)

**Tasks:** #15, #16, #17
**Runs:** Playwright against the web export; Maestro on iOS + Android simulators.

- #15 [TEST] Run Playwright tests against web build (`npx playwright test tests/web/`)
- #16 [TEST] Run Maestro iOS tests against live simulator (cap: 7m, fail-soft)
- #17 [TEST] Run Maestro Android tests against emulator (cap: 7m, fail-soft) — **MUST `xcrun simctl shutdown all` first** so Maestro doesn't hang at "multiple devices detected" (Android Maestro Test Tips, fix-patterns)

These tasks each have `maxWaitSeconds: 420` (7 minutes per PRD #53 TIMEOUT-001 default for Maestro caps). Outcome is **annotated** as `subPlatformsTested[]` / `subPlatformsSkipped[]` on the Step 6 report, NOT used as a gate on terminal tasks (PRD #56 MAESTRO-003).

**Validation checkpoint:**
- All three test runs either pass OR fail-soft on cap-hit with structured exit
- v2 ROI signal: Maestro swipe-delete passes in **≤2 iterations** (vs 5+ in v1)
- Step 6 captures the per-sub-platform test outcome

---

### Batch 7 — Documentation + Build Verification

**Tasks:** #20, #21, #22
**Verifies:** Clean build from scratch and full PRD coverage.

- #20 [BUILD] README with setup, scripts, architecture overview, EAS commands, Maestro instructions
- #21 [BUILD] FINAL-1: Build verification — clean `node_modules .expo dist`, reinstall, `tsc --noEmit`, `eslint`, `expo export --platform web`
- #22 [TEST] PRD Feature Verification (FINAL) — walk every user story / acceptance checkbox per platform

**Validation checkpoint:**
- Clean reinstall succeeds
- TS + lint pass
- Web export builds from scratch
- Every PRD acceptance checkbox confirmed on at least one platform; cross-platform-relevant ones confirmed on all three

---

### Batch 8 — Terminal Phase *(independent of `[TEST]` outcome — PRD #56 TERMINAL-001)*

**Tasks:** #18, #19
**Ships:** Web variant to Vercel + native source to GitHub.

- #19 [REPO] Push source to GitHub repo. Depends on: source committed + create-repo task emitted git remote. Does **NOT** depend on Maestro/Playwright outcome.
- #18 [DEPLOY] Deploy web build to Vercel (`vercel deploy dist/ --prod`). Depends on: source committed + the `expo export --platform web` task in Batch 4 produced `dist/` + Vercel auth preflight. Does **NOT** depend on Maestro/Playwright outcome.

**Why this matters:** PRD #56 finding #14 wedged for 11 minutes when terminal tasks sat downstream of a stalled Maestro task — the build produced no captured Vercel URL and no captured GitHub URL. The plan-validator (`src/core/build/plan-validator.ts`) rejects plans that wire `[DEPLOY]` or `[REPO]` `dependsOn: maestro-*` / `dependsOn: playwright-*`. This plan does not.

**Step 6 expectation:** Build report includes BOTH the Vercel URL AND the GitHub repo URL, plus `subPlatformsTested: ["ios", "android", "web"]` (or whatever subset survived preflight + test caps).

---

## 3. Tech Defaults

This PRD overrides several of the standard defaults in the prompt template — **use only what's listed below.** No NativeWind, no SQLite, no Reanimated, no maps, no bottom sheets.

| Layer | Choice |
|---|---|
| Framework | Expo SDK + Expo Router (TypeScript blank template) |
| Language | TypeScript (strict) |
| Routing | Expo Router (single-screen here, but typed routes baseline) |
| State | React `useState` |
| Persistence — native | `@react-native-async-storage/async-storage` |
| Persistence — web | In-memory `Map` (via `.web.ts` shim) |
| Web bridge | `react-native-web` + `react-dom` + `@expo/metro-runtime` *(REQUIRED — `expo export --platform web` fails without these)* |
| Safe area | `react-native-safe-area-context` |
| Gesture handler | `react-native-gesture-handler` (Swipeable on native; `Platform.OS === 'web'` branch on web) |
| Styling | React Native `StyleSheet` (no NativeWind — keeps surface area minimal for the v2 ROI test) |
| Native testing | Maestro (iOS Simulator + Android Emulator) |
| Web testing | Playwright |
| Web deploy | Vercel (`vercel deploy dist/ --prod`) |
| Native deploy | GitHub repo (artifact source) |

---

## 4. Platform Verification Strategy

| Batch | iOS Sim | Android Emu | Web (`expo export`) |
|---|---|---|---|
| Batch 0 | ✅ launch | ✅ launch | ✅ start |
| Batch 1 | — | — | ✅ export (storage shim sanity) |
| Batch 2 | ✅ render | ✅ render | ✅ export |
| Batch 3 | ✅ full flow | ✅ full flow | ✅ inline-delete flow |
| Batch 4 | (Maestro YAML lint) | (Maestro YAML lint) | ✅ pre-flight gate |
| Batch 5 | wrapper preflight | wrapper preflight | wrapper preflight |
| Batch 6 | ✅ Maestro live | ✅ Maestro live | ✅ Playwright live |
| Batch 7 | ✅ FINAL pass | ✅ FINAL pass | ✅ FINAL pass |

Beyond Batch 3, iOS is the primary day-to-day driver, but Android + web are checked in Batch 4 (pre-flight), Batch 6 (test execution), and Batch 7 (FINAL).

---

## 5. Validation Checkpoints (template per batch)

After every batch:

```bash
npx tsc --noEmit
npx eslint . --ext .ts,.tsx
```

Batches with UI changes additionally require:

```bash
# iOS launch + visual verification (mandatory per fix-patterns "Visual Verification Protocol")
xcrun simctl io booted screenshot /tmp/verify-batch-N.png
# Read the screenshot — confirm elements are visible (not zero-width)

# Web export sanity (PRD #59 gating signal)
npx expo export --platform web
ls dist/index.html  # must exist
```

Batch 6 onwards adds:

```bash
# Native — kill iOS first if running Android
xcrun simctl shutdown all
maestro test -p android .maestro/

# iOS
maestro test -p ios .maestro/

# Web
npx playwright test
```

---

## 6. Build Commands Reference

```bash
# Development
npx expo start                          # Dev server (all targets)
npx expo start --web                    # Web dev server
npx expo run:ios                        # iOS simulator
npx expo run:android                    # Android emulator

# Type checking & lint
npx tsc --noEmit
npx eslint . --ext .ts,.tsx

# Testing
npx playwright test                     # Web e2e
maestro test -p ios .maestro/           # iOS native e2e (kill Android first)
maestro test -p android .maestro/       # Android native e2e (kill iOS first via xcrun simctl shutdown all)

# Building
npx expo export --platform web          # Static web export → dist/

# Distribution (terminal phase — independent of [TEST] outcome)
vercel deploy dist/ --prod              # Web variant → Vercel
git push -u origin main                 # Native source → GitHub

# Sub-platform verification (PRD #55 — route through wrapper, NOT raw xcrun/vercel)
npx manifest preflight ios
npx manifest preflight android
npx manifest preflight web
```

---

## 7. Final Batch (Batch 7 + 8) Includes

- README.md with setup instructions, npm scripts, EAS build commands, Maestro instructions
- Maestro flows under `.maestro/` for iOS + Android (PRD #54 — both in scope, so per-platform-suffixed)
- Playwright specs under `tests/web/` matching Maestro test IDs
- App store assets — **deferred** for this validation build; Vercel preview URL + GitHub repo are the shipping artifacts
- PRD Feature Verification on iOS, Android, web
- Clean build test:
  ```bash
  rm -rf node_modules .expo dist
  npm install
  npx expo export --platform web
  npx tsc --noEmit
  npx eslint . --ext .ts,.tsx
  ```

---

## 8. Known React Native Gotchas (this build's hot zones)

These are the failure modes v1 hit. Knowledge files in PRD #59 exist specifically to prevent them — re-read before Batch 4.

- **Web bundle crash on native-only imports** — `@gorhom/bottom-sheet`, raw `react-native-gesture-handler` Swipeable, `expo-haptics`, AsyncStorage paths must NOT reach the web bundle without a `Platform.OS === 'web'` guard or a `.web.ts(x)` shim. (`hybrid-web-platform-guards.md`)
- **`expo export --platform web` is the gating signal** — run it locally BEFORE first Playwright invocation. Bundle errors there surface as silent Playwright failures otherwise. (`expo-web-export-verification.md`)
- **Maestro soft keyboard occlusion (iOS)** — insert `hideKeyboard:` between `inputText:` and `tapOn: id: add-habit-button`. Without it the keyboard covers the button. (`maestro-debugging-patterns.md`)
- **Maestro swipe-to-delete** — use named-element swipe `swipe: { from: { id: "habit-row-0" }, direction: LEFT }`. Raw pixel coordinates drift between simulator versions and produce 5+ retry loops (v1's wedge mode).
- **Maestro multi-device wedge** — `xcrun simctl shutdown all` BEFORE `maestro test -p android` so it doesn't prompt for "Multiple running devices detected" and hang waiting for stdin (fix-patterns: Android Maestro Test Tips).
- **`react-native-web` is mandatory** — without it `expo export --platform web` fails with module-resolution errors and the Vercel deploy publishes an empty `dist/`.
- **`GestureHandlerRootView` wraps the app on native** — Swipeable on `HabitRow` won't work otherwise. Wrap in `_layout.tsx`.
- **Safe areas** — wrap content in `SafeAreaView` so the iPhone notch + home indicator don't clip the title or platform info card.
- **Android route params (Expo Router)** — `useLocalSearchParams()` returns dynamic params as arrays on Android. Use `Array.isArray(p.id) ? p.id[0] : p.id`. (Not load-bearing for this PRD's single-screen layout, but important for any route added later.)
- **Pressable style-function width bug** — if a `Pressable` uses a style function (`style={({ pressed }) => [...]}`) and width comes through that function, width may render as 0. Wrap in a parent `<View style={{ width }}>` and let the inner `Pressable` flex to fill. Visual screenshot verification per fix-patterns Visual Verification Protocol.
- **iOS flexbox `width: '100%'` evaluates to 0** when no parent width is defined. Use `alignSelf: 'stretch'` + explicit `minHeight` on touch targets (≥44pt).
- **`testID` → `data-testid`** — `react-native-web` exposes `testID` as `data-testid` on web automatically. Verify in the Batch 4 web export so Maestro and Playwright share assertions.
- **Use bounded `until`-loop polling** for native build readiness, NOT `ScheduleWakeup` (PRD #56).

---

## 9. Terminal-Step Independence Diagram (PRD #56 TERMINAL-001 reference)

```
batch-N-source-committed ──┬──► [BUILD] expo export --platform web ──┬──► [DEPLOY] Vercel
                           │                                          │
                           ├──► [TEST] Maestro iOS  (annotation only) │
                           ├──► [TEST] Maestro Android (annotation)   │
                           ├──► [TEST] Playwright Web (annotation)    │
                           │                                          │
                           └──► [REPO] GitHub push  ◄─────────────────┘
                                       (depends only on source + remote-configured)
```

`[DEPLOY]` and `[REPO]` have **no `dependsOn` edge to any `[TEST]` task.** The plan-validator at `src/core/build/plan-validator.ts` enforces this.

---

## 10. v2 ROI Signals (PRD-mandated)

These are checked at Step 6 against the actual build cost and outcome:

- e2e phase total cost **<$15** (vs ~$31 in v1)
- No web bundle crash on native-only imports
- Maestro swipe-delete passes in **≤2 iterations**
- Pre-flight `expo export --platform web` ran BEFORE first Playwright invocation
- Step 6 report includes BOTH Vercel URL AND GitHub URL
- Step 6 report includes `subPlatformsTested: ["ios", "android", "web"]` annotation
