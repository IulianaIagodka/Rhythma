# Rhythma — agent / LLM context

Read this first when starting cold on this repo. It is the project briefing for new agents and models.

**Repo:** https://github.com/IulianaIagodka/Rhythma  
**Owner:** Iuliana Iagodka (`iuliana.iagodka`) · support `iuliana.iagodka@gmail.com`  
**Product site / Pages:** https://iulianaiagodka.github.io/Rhythma/

---

## What it is

Rhythma is a **private iPhone menstrual cycle tracker** that pairs period logging with **calendar planning** (phone events + rest). It is **not** a fertility, contraception, or medical device app.

- No accounts, no backend, no cloud sync of cycle data — **on-device only** (AsyncStorage).
- iPhone only (`supportsTablet: false`). Android package id exists in config; product focus is iOS.
- UI languages: **English** and **Ukrainian** (follows phone locale; no in-app language picker).

| ID | Value |
| --- | --- |
| Bundle / package | `app.rhythma.cycle` |
| App Store Connect app id | `6802549751` |
| Apple Team | `F8M552HN2V` |
| EAS project id | `f1157231-8250-45b9-a28f-94f35c10b230` |
| Expo account | `@iuliana.iagodka/rhythma` |

---

## Tech stack

| Piece | Version / notes |
| --- | --- |
| Expo | ~57 |
| React Native | 0.86 |
| React | 19 |
| Language | TypeScript (strict) |
| Entry | `index.js` → `App.tsx` |
| Storage | `@react-native-async-storage/async-storage` key `rhythma.v1` |
| Calendar | `expo-calendar` — **read via `expo-calendar/legacy`** (`getEventsAsync`) |
| IAP | `expo-iap` — plugin injected only when `EXPO_PUBLIC_IAP_PLUS=1` (`app.config.js`) |
| Charts | `react-native-svg` + `src/chartPath.ts` |
| Native module | `modules/is-testflight` (Swift) — runtime TF detect (unreliable; see QA below) |
| Tests | `tsx --test src/*.test.ts` (no Jest) |
| CI | `.github/workflows/test.yml` — `npm test` + `npx tsc --noEmit` |

---

## Repo map

```
App.tsx                 # Today / Year / Settings UI (main screen)
app.json / app.config.js
eas.json                # Build & submit profiles
src/                    # Domain logic, components, *.test.ts
modules/is-testflight/  # Native TestFlight detection
docs/                   # support, privacy, ASC copy, GH Pages, screenshots
.cursor/rules/          # Always-on agent rules (PR test gate)
assets/
```

### Important `src/` modules

| File | Responsibility |
| --- | --- |
| `access.ts` | Free / Plus tiers, feature gates, env unlock flags |
| `firstCycleTrial.ts` | First-cycle Plus trial (one logged period start) |
| `iapPlus.ts`, `useIAPPlus.ts`, `PlusFreeCard.tsx` | Subscription product IDs + purchase UI |
| `cycle.ts` | Period starts, phases, forecast, energy/hormone curves |
| `activity.ts` | `cycleInsight()` vs `adviseLoad()` (schedule insight) |
| `calendar.ts`, `calendarSync.ts`, `calendarItems.ts` | EventKit read path, event flattening, title → activity |
| `settingsControls.ts` | Toggle rules, Sync button visibility, Connect calendar CTA |
| `feedback.ts` | Mailto builder for Settings → Send feedback |
| `i18n.ts` | `en` / `uk` strings |
| `sources.ts`, `SourcesSheet.tsx` | Methodology + citations (ASC 1.4.1) |
| `CycleRhythm.tsx` | Compact energy sparkline + expanded Energy & hormones modal |
| `WeekStrip.tsx`, `YearCalendar.tsx` | Week / year calendars |
| `storage.ts` | Load/save + settings migrations |
| `theme.ts`, `dates.ts`, `testflight.ts` | Theme, date helpers, TF wrapper |

`App.tsx` tabs: **Today** | **Year** | **More (Settings)**. Global `SourcesSheet` for methodology deep-links from ⓘ buttons.

---

## Free vs Plus

Stored as `settings.accessTier`: `'free' | 'pro'`.

| Feature key | Tier | Behavior |
| --- | --- | --- |
| `calendarSync` | free | Phone calendar events on week/year |
| `phaseTitle` | free | Phase name on Today |
| `eventLoadAdvice` | pro | Cycle insight + Schedule insight |
| `phasePlanningLists` | pro | Phase planning lists (gated) |
| `cycleRhythm` | pro | Energy / hormone curve |

**Free Today extras when Cycle insight is off:** short `phaseBriefDescription` on the cycle card (one ⓘ only, top-right).

### First-cycle Plus trial

While the user has **exactly one** logged period start (and is on Free, no preview unlock), Plus features unlock until the **next** logged period start:

- Notices on Today: trial started → ending soon (`daysUntilNextPeriod <= 3`) → ended on 2nd cycle log.
- Calendar sync stays free and is **not** tied to this messaging.
- Settings Plus toggles appear via the same unlock (`plusFeaturesUnlocked`).

### Subscriptions (StoreKit)

| Plan | Product ID | Listed price (docs) |
| --- | --- | --- |
| Monthly | `app.rhythma.cycle.plus.monthly` | $2.99 |
| Yearly | `app.rhythma.cycle.plus.yearly` | $14.99 |

- Type: auto-renewable **`subs`** (not Non-Consumable).
- **Never reuse** retired Non-Consumable id `app.rhythma.cycle.plus` (burned in ASC).
- Purchase UI only when `EXPO_PUBLIC_IAP_PLUS=1`.
- Restore via StoreKit; unlocks set `accessTier: 'pro'`. No app login — Apple ID owns the sub.

### Env flags

| Flag | Effect |
| --- | --- |
| `EXPO_PUBLIC_IAP_PLUS=1` | Paywall / subscribe UI + `expo-iap` plugin |
| `EXPO_PUBLIC_PLAN_SWITCH=1` | Free / Plus QA switch in Settings |
| `EXPO_PUBLIC_UNLOCK_PRO=1` | Force Plus (development profile) |
| `__DEV__` | Also enables plan switch |

`canSwitchPlan()` = plan-switch env **or** `__DEV__` **or** `isTestFlightRuntime()`.

---

## EAS profiles (`eas.json`)

| Profile | Use for | Env |
| --- | --- | --- |
| `production` | App Store | `EXPO_PUBLIC_IAP_PLUS=1` — **no** plan switch |
| `testflight` | **QA / TestFlight** | production + `EXPO_PUBLIC_PLAN_SWITCH=1` |
| `preview` / `internal` | Internal QA | plan switch |
| `development` | Dev client | `EXPO_PUBLIC_UNLOCK_PRO=1` |
| `plus` | Alias of production (IAP already on) |

`cli.appVersionSource` is **remote**; `production` has `autoIncrement` for iOS **build number** only.

### Version vs build number (important)

| Field | Where | When to change |
| --- | --- | --- |
| **Version** (`expo.version` / CFBundleShortVersionString, e.g. `1.0.8`) | `app.json` + `package.json` | **Only after an App Store release** — bump for the *next* cycle once the current version is live on the store (or if the user explicitly asks). Never for TestFlight-only / UI polish builds. |
| **Build number** (CFBundleVersion, e.g. `88`) | EAS remote `autoIncrement` | Every EAS iOS build — automatic. |

**Rule:** TestFlight and pre-release iteration → same marketing version, rising build number only. **Bump `1.0.x` only after release** (start of the next release train), not before each build. The post–build-78 habit of 1.0.1…1.0.8 per ship was wrong.

### Build / submit (typical QA)

```bash
npx eas-cli build --platform ios --profile testflight --auto-submit --non-interactive
```

Submit targets ASC app `6802549751`.

### Critical QA gotcha

Runtime TestFlight detection is **unreliable** on modern iOS. A **production**-profile binary installed via TestFlight may still show the **paywall**, not Free/Plus. For QA that needs the plan switch, always build **`--profile testflight`**.

---

## Domain behavior (short)

### Cycle

- User logs **period start** dates; app derives cycle day, phase (menstrual / follicular / ovulatory / luteal), next-period estimate.
- Energy + estrogen + progesterone curves in `cycle.ts` are **illustrative relative curves**, not lab values (copy must say so).

### Calendar

- Default `calendarSync: true`. Free for everyone.
- Reads **all calendars with IDs** — **do not filter by `isVisible`** (subscribed calendars would vanish).
- Prefer legacy EventKit APIs for reliable date serialization.
- iOS has **no read-only Calendar permission** — product asks for **Full Access** but only reads (never create/edit/delete). Keep Info.plist + Settings + privacy copy aligned.
- Google Calendar: user adds Google in **iOS Settings → Calendar**, not OAuth in-app.

### Insights

- **Cycle insight (Plus):** phase + hormone context only; works with calendar sync off.
- **Schedule insight (Plus):** advice from real events (`adviseLoad`); toggle disabled when sync off; social `event` titles do not add physical load units.
- **Connect calendar CTA** on Today whenever sync is off (`connectCalendarCtaVisible`).
- **Energy chart ⓘ:** close the expanded `CycleRhythm` modal **before** opening `SourcesSheet` — stacked RN Modals otherwise appear to do nothing.

### Sources & Methodology

- Free for all. Settings row + contextual ⓘ on estimates.
- Citations / sections in `sources.ts` (PubMed, ACOG, etc.) — ASC Guideline **1.4.1**.

### Feedback

- Settings → Send feedback → `mailto:iuliana.iagodka@gmail.com` with version / build / iOS prefilled (`src/feedback.ts`).

---

## Commands

```bash
npm install
npm test                 # must pass
npx tsc --noEmit         # must pass
npm start                # expo start
```

### PR / merge gate (`.cursor/rules/pr-test-coverage.mdc`)

1. `npm test` and `npx tsc --noEmit` must pass before merging to `main`.
2. Every logic/behavior change needs matching coverage in `src/*.test.ts`.
3. Docs/copy/metadata-only changes need no new tests but must still pass the suite.
4. Note what was tested in the merge/PR summary.

Existing tests: `access`, `activity`, `calendar`, `chartPath`, `cycle`, `feedback`, `firstCycleTrial`, `iapPlus`, `settingsControls`, `sources`, `WeekStrip`, `yearCalendarLayout`.

---

## Docs to read next

| Path | Why |
| --- | --- |
| `README.md` | Product overview + EAS matrix |
| `docs/app-store-copy.md` | ASC listing, IAP setup, review notes |
| `docs/support.md` | User-facing support (EN/UK) |
| `docs/privacy.md` | Privacy policy source |
| `docs/screenshots/README.md` | Screenshot sizes; TF plan pill not for ASC |
| `.cursor/rules/pr-test-coverage.mdc` | Test gate |

---

## Secrets & what not to invent

- **No** Apple API keys, `.p8`, certificates, or `.env` secrets in git (see `.gitignore`).
- Signing lives in **EAS credentials**.
- Product IDs and ASC/team IDs in repo are public identifiers, not secrets.
- Cycle data must stay on-device — do not add a backend or upload path unless explicitly requested.
- Do not hardcode prices into purchase logic; StoreKit returns localized prices at runtime (docs may list USD for ASC setup).

---

## Working agreements for agents

1. Prefer small, focused diffs; match existing patterns in `App.tsx` / `src/`.
2. After behavior changes: add/update `src/*.test.ts`, run `npm test` and `npx tsc --noEmit`.
3. Do **not** auto-start EAS builds unless the user asks (“білд”, “build”, “TestFlight”, etc.).
4. For TestFlight QA builds use profile **`testflight`**, not `production`.
5. **Bump marketing `version` only after an App Store release** (for the next cycle). Until then keep the same version; only EAS `autoIncrement` build number rises. Do not bump version for TestFlight/UI builds unless the user explicitly asks.
6. Cloud agents: use branch prefix `cursor/…-a260`; open/update PRs via the ManagePullRequest tool (not `gh pr create`).
7. Keep medical/methodology claims aligned with `sources.ts` and existing disclaimers.
8. Ukrainian user messages are normal; UI copy lives in both `en` and `uk` in `i18n.ts`.

---

## Current release snapshot (update when stale)

- App marketing version: **1.0.8** — keep until this version is released on the App Store; bump only afterward (or if the user asks).
- Default git branch for new work unless told otherwise: **`main`**.

When this file drifts from the code, **trust the code and `eas.json`**, then update this briefing.
