# Daily Habits Tracker (v2) — Hybrid Counter+

Single TypeScript codebase that ships to **iOS, Android, and web** from one Expo project.

- **Live web:** https://daily-habits-v2-chi.vercel.app (currently behind Vercel deployment protection — unprotect in project settings to share)
- **Source:** https://github.com/jimzim/daily-habits-v2
- **Spec:** [PRD.md](./PRD.md) — `[EXECUTION_PLAN.md](./EXECUTION_PLAN.md)`

## Overview

Add named habits, mark them done for the day, see a 7-day completion grid, and delete habits. Persistence is platform-branched: `AsyncStorage` on native, in-memory `Map` on web (PRD calls this out as expected — web sessions reset).

The point of v2 is to validate the PRD #59 knowledge files (`hybrid-web-platform-guards.md`, `expo-web-export-verification.md`, `maestro-debugging-patterns.md`). v1 spent ~$31 in e2e debugging the `@gorhom/bottom-sheet` web crash and a flaky Maestro swipe-delete; v2 should hit those cleanly on the first pass.

## Getting started

```bash
npm install
npx expo start         # all targets
npx expo start --ios   # iOS Simulator
npx expo start --android
npx expo start --web   # localhost:8081
```

## npm scripts

| Script | Description |
|---|---|
| `npm start` | Expo dev server (interactive) |
| `npm run ios` | Run on iOS Simulator |
| `npm run android` | Run on Android Emulator |
| `npm run web` | Run on web (Metro) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint over `.ts`/`.tsx` |
| `npm run build` | `expo export --platform web` → `dist/` |

## Architecture

```
src/
  app/
    _layout.tsx          # SafeAreaProvider + GestureHandlerRootView + Expo Router Stack
    index.tsx            # Single-screen layout: title, AddHabitRow, HabitList, PlatformInfoCard
  components/
    AddHabitRow.tsx      # TextInput + Pressable Add button (disabled on empty)
    HabitList.tsx        # FlatList of HabitRow + empty state
    HabitRow.tsx         # Platform.OS branch: Swipeable (native) / inline [Delete] (web)
    PlatformInfoCard.tsx # Platform.OS, Platform.Version, habit count, web ephemeral warning
  lib/
    storage.d.ts         # Type declarations Metro/TS uses to resolve `@/lib/storage`
    storage.native.ts    # AsyncStorage-backed implementation (iOS, Android)
    storage.web.ts       # In-memory Map implementation (web — no AsyncStorage import)
    types.ts             # Habit, CompletionRecord, lastNDays helper
.maestro/                # Native e2e flows (iOS + Android)
tests/web/               # Playwright web specs
```

### The `.web.ts` / `.native.ts` split (v1 → v2 lesson)

Metro auto-resolves `storage.web.ts` for the web bundle and `storage.native.ts` for iOS/Android. TypeScript reads `storage.d.ts` for the shared surface. **The web bundle never imports `@react-native-async-storage/async-storage`** — confirmed via post-export bundle scan (see "Pre-flight check" below). This is the exact pattern that prevents v1's `@gorhom/bottom-sheet` web crash from recurring.

`HabitRow.tsx` uses the same idea inline: `Platform.OS === 'web'` renders an inline `[Delete]` button; `Platform.OS !== 'web'` lazy-`require`s `react-native-gesture-handler`'s `Swipeable`. The require is conditional so the import never resolves on web.

### Pre-flight check (gates Playwright)

Before running Playwright, run `npx expo export --platform web` and grep the bundle:

```bash
npx expo export --platform web
BUNDLE=$(ls dist/_expo/static/js/web/*.js | head -1)
grep -oE '(ExpoSQLite|@gorhom/bottom-sheet|@react-native-async-storage)' "$BUNDLE" | sort -u
# Expected output: empty
```

A failing pre-flight is a "broken-on-load" web bundle — Playwright would fail every test silently otherwise.

## Testing

### Native (Maestro)

```bash
# IMPORTANT: kill iOS sim before Android run, otherwise Maestro hangs
xcrun simctl shutdown all

maestro test -p ios .maestro/
maestro test -p android .maestro/
```

Flows:

- `.maestro/add_and_complete_habit.yaml` — add a habit, mark today done, assert filled cell
- `.maestro/delete_habit_swipe.yaml` — swipe-left, tap Delete, assert removed
- `.maestro/platform_info_native.yaml` — assert platform card visible and shows ios/android

Each Maestro flow uses **`hideKeyboard:` between `inputText:` and the Add tap** and **named-element swipe (`swipe: { from: { id: "habit-row-0" }, direction: LEFT }`)** — the two patterns v1 burned the most retries on.

### Web (Playwright)

```bash
npx expo export --platform web
npx playwright test
```

Specs:

- `tests/web/habits.spec.ts` — add a habit and mark it complete
- `tests/web/delete-inline.spec.ts` — delete via inline `[Delete]` button (NOT swipe)
- `tests/web/platform-info.spec.ts` — assert platform card shows `web` + ephemeral-storage warning

Playwright spins up `npx serve dist -l 3000` via `webServer` in `playwright.config.ts`. testIDs in source (`testID="add-habit-input"`) become `data-testid` attributes on the web bundle automatically via `react-native-web`.

## Deployment

| Variant | Command | Target |
|---|---|---|
| Web | `npx expo export --platform web` then `vercel deploy --prod dist/` | Vercel |
| iOS | `npx expo prebuild --platform ios` then `xcodebuild` (or EAS for distribution) | TestFlight (eventually) |
| Android | `npx expo prebuild --platform android` then `gradle assembleDebug` (or EAS) | Play Console (eventually) |

For this build the shipping artifacts are the **Vercel preview URL** and the **GitHub repo** — see the badges at the top.

### Vercel

`vercel.json` rewrites all routes to `/index.html` (SPA routing for Expo Router). The `dist/vercel.json` is a copy so the deploy carries it.

### GitHub

Repo is `jimzim/daily-habits-v2` on `main`. Native source lives there; native folders (`/ios`, `/android`) are gitignored because they're regenerated by `expo prebuild`.

## Why v2 exists

PRD #59 introduced a knowledge-file system intended to short-circuit known web-bundle and Maestro failure modes. v1 (the predecessor build) burned ~$31 in e2e iteration on:

1. **`@gorhom/bottom-sheet` reaching the web bundle** — Reanimated worklets crash the bundle on first paint. v2 uses no bottom sheet on web and never imports the module unguarded.
2. **`react-native-gesture-handler` `Swipeable` on web** — unreliable. v2 web uses an inline `[Delete]` button.
3. **`AsyncStorage` reaching the web bundle** — wastes bytes and triggers warnings. v2 uses the `.web.ts` / `.native.ts` split.
4. **Maestro swipe-to-delete with raw pixel coordinates** — drifts between simulator versions, takes 5+ retries. v2 uses named-element swipe.
5. **Maestro soft-keyboard occluding the Add button** — flaky tap. v2 inserts `hideKeyboard:` between `inputText:` and `tapOn:`.

The success metric for v2: **e2e phase total cost <$15** (vs ~$31 in v1).
