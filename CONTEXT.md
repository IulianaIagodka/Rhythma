# Rhythma — agent / LLM context

**Read this first** when starting cold on this repo. Enough product, code, and ops context to work from zero without prior chat history.

**Repo:** https://github.com/IulianaIagodka/Rhythma  
**Owner:** Iuliana Iagodka (`iuliana.iagodka`) · support `iuliana.iagodka@gmail.com`  
**Product site / Pages:** https://iulianaiagodka.github.io/Rhythma/  
**Default branch:** `main`

Owner often writes in **Ukrainian**. Reply in the language they use. UI strings must stay in **both** `en` and `uk`.

---

## What it is

Rhythma is a **private iPhone menstrual cycle tracker** that pairs period logging with **calendar planning** (phone events + rest). It is **not** a fertility, contraception, or medical device app.

| Trait | Detail |
| --- | --- |
| Accounts / backend | **None** — cycle data stays on-device (AsyncStorage) |
| Platforms | **iPhone only** (`supportsTablet: false`). Android package id exists; product focus is iOS |
| Languages | **English** + **Ukrainian** from phone locale (`expo-localization`). No in-app language picker |
| Tabs | **Today** · **Year** · **More (Settings)** |

| ID | Value |
| --- | --- |
| Bundle / package | `app.rhythma.cycle` |
| App Store Connect app id | `6802549751` |
| Apple Team | `F8M552HN2V` |
| EAS project id | `f1157231-8250-45b9-a28f-94f35c10b230` |
| Expo account | `@iuliana.iagodka/rhythma` |
| Support email | `iuliana.iagodka@gmail.com` |

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
| Native module | `modules/is-testflight` (Swift) — runtime TF detect (**unreliable**; see QA) |
| Tests | `tsx --test src/*.test.ts` (no Jest) |
| CI | `.github/workflows/test.yml` — `npm test` + `npx tsc --noEmit` |

---

## Repo map

```
App.tsx                 # Today / Year / Settings UI (main screen)
app.json / app.config.js
eas.json                # Build & submit profiles
package.json            # version + scripts
src/                    # Domain logic, components, *.test.ts
modules/is-testflight/  # Native TestFlight detection
docs/                   # support, privacy, ASC copy, GH Pages, screenshots
.cursor/rules/          # Always-on agent rules (PR test gate)
CONTEXT.md              # This file — cold-start briefing
README.md               # Short product overview (points here)
assets/
```

### Important `src/` modules

| File | Responsibility |
| --- | --- |
| `access.ts` | Free / Plus tiers, feature gates, env unlock flags |
| `monetization.ts` | Paid-launch gate, Early Access / Founder vs standard, QA override |
| `firstCycleTrial.ts` | First-cycle free-Plus trial timing |
| `FirstCycleTrialCard.tsx` | Trial notices (started / ending / ended) |
| `iapPlus.ts`, `useIAPPlus.ts`, `PlusFreeCard.tsx` | Subscription product IDs + purchase / paywall UI |
| `cycle.ts` | Period starts, phases, forecast, energy/hormone curves, settings shape |
| `activity.ts` | **User-facing insight copy** (UK/EN): `cycleInsight`, `adviseLoad`, `weekPlanInsight`, phase tips |
| `calendar.ts`, `calendarSync.ts`, `calendarItems.ts` | EventKit read, flatten, title → activity kind |
| `settingsControls.ts` | Toggle rules, Sync button visibility, Connect calendar CTA |
| `feedback.ts` | Mailto builder for Settings → Send feedback |
| `i18n.ts` | Static UI strings (`en` / `uk`) + `t()` |
| `sources.ts`, `SourcesSheet.tsx` | Methodology + citations (ASC 1.4.1) |
| `CycleRhythm.tsx` | Compact energy sparkline + expanded Energy & hormones modal |
| `WeekStrip.tsx`, `YearCalendar.tsx`, `ConfirmDialog.tsx` | Week / year calendars, confirm prompts |
| `storage.ts` | Load/save + settings migrations |
| `theme.ts`, `dates.ts`, `testflight.ts` | Theme, dates, TF wrapper |

**Copy locations:** static chrome → `i18n.ts`. Dynamic insights / phase tips / schedule sentences → `activity.ts`. Keep both languages in sync.

---

## Product model: Free vs Plus

Stored as `settings.accessTier`: `'free' | 'pro'`.

| Feature key | Tier | Behavior |
| --- | --- | --- |
| `calendarSync` | **free** | Phone calendar events on week/year |
| `phaseTitle` | **free** | Phase name on Today |
| `eventLoadAdvice` | **pro** | Cycle insight + Schedule insight |
| `phasePlanningLists` | **pro** | Week-plan card (gated via `showPhaseLists`) |
| `cycleRhythm` | **pro** | Energy / hormone curve |

**Free Today** when Cycle insight is off: short `phaseBriefDescription` on the cycle card (one ⓘ, top-right).

**Plus Today extras:**
- Cycle insight: phase + hormone note + **cognitive** and **social** tips (wellness tone, not medical).
- **Week plan** on Sunday/Monday (`showPhaseLists` + `phasePlanningLists`).
- Schedule insight from real calendar titles (`adviseLoad`).
- Calendar titles classify into workouts **and** `focus` / `meeting` / `social`.

---

## First-cycle Plus trial

While the user has **exactly one** logged period start (Free, no preview unlock), Plus features unlock until the **next** logged period start:

1. **Started** — blocking modal on first period log  
2. **Ending soon** — Today card when `daysUntilNextPeriod <= 3`  
3. **Ended** — blocking modal on 2nd cycle log  

- Magenta-tinted trial surface (not a gray card). Hierarchy: FREE NOW → UNTIL NEXT PERIOD → PLUS AFTERWARDS.
- Started/ended are **blocking modals** — UI not tappable until an explicit choice.
- Calendar sync stays free and is **not** part of this messaging.
- Settings Plus toggles appear during the trial (`plusFeaturesUnlocked`).
- Logic: `firstCycleTrial.ts` · UI: `FirstCycleTrialCard.tsx`.

---

## Monetization (paid launch)

**Status (as of briefing):** FOP / paid launch **not live yet**. Master switch defaults **off** so Plus stays open for wider TestFlight testing.

### Gate

```
secondCycle && isMonetizationEnabled()  →  show paywall / require Plus
```

`isMonetizationEnabled()` = QA override **or** `EXPO_PUBLIC_MONETIZATION === '1'`.

While monetization is **off**: Plus features stay unlocked for testing (even after second cycle).

### Cohorts & yearly list prices (PLN, display hints)

| Cohort | How assigned | Path | Yearly hint |
| --- | --- | --- | --- |
| **Founder** (first ~50) | `EXPO_PUBLIC_EARLY_ACCESS=1` at **install** stamps `pricingCohort: 'founder'` | Early Access → announcement → 1 final free cycle → Founder price | **29.99 zł** |
| **Standard** | Default when enrollment env is off | Install → 1 free first cycle → Plus | **49.99 zł** |

Constants / logic: `EARLY_ACCESS_CAP`, `FOUNDER_YEARLY_PLN`, `STANDARD_YEARLY_PLN` in `src/monetization.ts`.

Settings fields: `pricingCohort`, `earlyAccessAnnouncementSeen`, `earlyAccessFreeCycleLimit`, `qaMonetizationEnabled`.

**Important:** StoreKit still uses the subscription products below. PLN amounts are **UI/list hints** for the Polish storefront story; runtime purchase prices come from StoreKit.

### QA toggles (no rebuild)

On builds where `canSwitchPlan()` is true (TestFlight profile / `__DEV__` / plan-switch env), Settings shows:

- Monetization on/off (`setQaMonetizationOverride`)
- Founder / Standard cohort
- Reset Early Access notice (re-show announcement + reset final free cycle)

### Subscriptions (StoreKit)

| Plan | Product ID | ASC docs (USD base) |
| --- | --- | --- |
| Monthly | `app.rhythma.cycle.plus.monthly` | $2.99 |
| Yearly | `app.rhythma.cycle.plus.yearly` | $14.99 |

- Type: auto-renewable **`subs`** (not Non-Consumable).
- **Never reuse** retired Non-Consumable id `app.rhythma.cycle.plus` (burned in ASC).
- Purchase UI only when `EXPO_PUBLIC_IAP_PLUS=1`.
- Restore via StoreKit → `accessTier: 'pro'`. No app login — Apple ID owns the sub.

### Env flags

| Flag | Effect |
| --- | --- |
| `EXPO_PUBLIC_IAP_PLUS=1` | Paywall / subscribe UI + `expo-iap` plugin |
| `EXPO_PUBLIC_PLAN_SWITCH=1` | Free / Plus QA switch + monetization QA toggles in Settings |
| `EXPO_PUBLIC_UNLOCK_PRO=1` | Force Plus (development profile) |
| `EXPO_PUBLIC_MONETIZATION=1` | Turn on paid gate (second cycle → paywall) |
| `EXPO_PUBLIC_EARLY_ACCESS=1` | New installs stamped Founder (enrollment window) |
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

`cli.appVersionSource` is **remote**; `production` / profiles that extend it use `autoIncrement` for iOS **build number** only.

### Version vs build number

| Field | Where | When to change |
| --- | --- | --- |
| **Version** (`expo.version` / marketing, e.g. `1.0.8`) | `app.json` + `package.json` | **Only after an App Store release** — bump for the *next* cycle once current is live (or if the user explicitly asks). Never for TestFlight-only / UI polish. |
| **Build number** (CFBundleVersion) | EAS remote `autoIncrement` | Every EAS iOS build — automatic |

**Rule:** TestFlight iteration → same marketing version, rising build number only.

### Typical QA build + submit

```bash
npx eas-cli build --platform ios --profile testflight --auto-submit --non-interactive
```

Submit targets ASC app `6802549751`.

### Critical QA gotcha

Runtime TestFlight detection is **unreliable** on modern iOS. A **production**-profile binary installed via TestFlight may still hide the Free/Plus switch. For QA that needs the switch / monetization toggles, always build **`--profile testflight`**.

### Expo billing (ops)

- Account is typically on **EAS Starter** (~$19/mo → ~$45 build credits).
- Credits reset each billing period; when exhausted, further builds are **usage-based (paid)**.
- **Do not start EAS builds unless the user asks** (“білд”, “build”, “TestFlight”, “submit”, etc.).
- Prefer checking Expo billing / `eas build:list` before suggesting a new cloud build if credits may be low.

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

- **Cycle insight (Plus):** phase + hormone context; works with calendar sync off.
- **Schedule insight (Plus):** from real events (`adviseLoad`); toggle disabled when sync off; social `event` titles do not add physical load units.
- **Connect calendar CTA** on Today whenever sync is off.
- **Energy chart ⓘ:** close the expanded `CycleRhythm` modal **before** opening `SourcesSheet` — stacked RN Modals otherwise appear to do nothing.

### Sources & Methodology

- Free for all. Settings row + contextual ⓘ on estimates.
- Citations in `sources.ts` (PubMed, ACOG, etc.) — ASC Guideline **1.4.1**.

### Feedback

- Settings → Send feedback → `mailto:iuliana.iagodka@gmail.com` with version / build / iOS prefilled (`feedback.ts`).

### i18n / copy polish

- Static UI: `src/i18n.ts` (`copy.uk` / `copy.en`, keys must match — compile-time assert).
- Insight sentences / fit chips / week-plan lists: `src/activity.ts`.
- Prefer natural Ukrainian (vy-form, avoid calques like «мітинги» for meetings, «таймінг», English labels in UK UI).
- Product names may stay English: Plus, Free, Founder, Rhythma, TestFlight.

---

## Commands

```bash
npm install
npm test                 # must pass
npx tsc --noEmit         # must pass (also: npm run typecheck)
npm start                # expo start
```

### PR / merge gate (`.cursor/rules/pr-test-coverage.mdc`)

1. `npm test` and `npx tsc --noEmit` must pass before merging to `main`.
2. Every logic/behavior change needs matching coverage in `src/*.test.ts`.
3. Docs/copy/metadata-only changes need no new tests but must still pass the suite.
4. Note what was tested in the merge/PR summary.

Existing test suites include: `access`, `activity`, `calendar`, `chartPath`, `cycle`, `feedback`, `firstCycleTrial`, `iapPlus`, `monetization`, `settingsControls`, `sources`, `WeekStrip`, `yearCalendarLayout`.

---

## Docs to read next

| Path | Why |
| --- | --- |
| `README.md` | Short product overview + EAS matrix |
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
- Do not hardcode StoreKit purchase amounts into purchase logic; StoreKit returns localized prices at runtime (docs may list USD for ASC; PLN Founder/Standard are display hints).

---

## Working agreements for agents

1. Prefer small, focused diffs; match existing patterns in `App.tsx` / `src/`.
2. After behavior changes: add/update `src/*.test.ts`, run `npm test` and `npx tsc --noEmit`.
3. Do **not** auto-start EAS builds unless the user asks.
4. For TestFlight QA builds use profile **`testflight`**, not `production`.
5. **Bump marketing `version` only after an App Store release** (for the next cycle). Until then keep the same version; only EAS build number rises.
6. Cloud agents: branch prefix `cursor/<name>-a260`; open/update PRs via **ManagePullRequest** (not `gh pr create` for write).
7. Keep medical/methodology claims aligned with `sources.ts` and existing disclaimers.
8. When changing user-visible text, update **both** languages and check `activity.ts` as well as `i18n.ts`.
9. When this briefing drifts from the code, **trust the code and `eas.json`**, then update this file.

---

## Current release snapshot (update when stale)

| Item | Value |
| --- | --- |
| Marketing version | **1.0.8** — keep until App Store release of this version; bump only afterward (or if user asks) |
| Recent TestFlight | build **97** (profile `testflight`) — confirm with `eas build:list` if needed |
| Monetization env | **Off** by default (Plus open for TF testing until FOP) |
| Early Access enrollment | Off unless `EXPO_PUBLIC_EARLY_ACCESS=1` on the build |
| Default git branch | **`main`** |

When this file drifts from the code, **trust the code and `eas.json`**, then update this briefing.
