# App Store Connect copy — Rhythma Cycle

## Promo Text

Plan around your cycle, not against it. Sync Rhythma with your calendar and make your plans with your rhythm in mind.

## Description

Your cycle doesn’t happen separately from your life. Rhythma brings your cycle and calendar together, helping you plan with your body—not against it.

Record the first day of your period in one tap, see where you are in your cycle, and get predictions for your next period and optional ovulation window. Forecast cycle days and ovulation past your open logged cycle are labeled as predicted.

Connect your iPhone calendar to view upcoming events alongside your cycle. Rhythma helps you notice busy days, create space for recovery, and choose better moments for demanding work, workouts, meetings, and rest.

With Rhythma, you can:

• Record your period quickly
• See your current cycle day and phase
• View predicted periods across the year
• Optionally estimate ovulation
• Sync with Apple Calendar (Google events via iPhone Calendar accounts)
• See events and workouts alongside your cycle
• Switch between light and dark themes
• Use the app in English or Ukrainian

Rhythma Plus (monthly or yearly auto-renewable subscription) unlocks Cycle insight, Schedule insight, and the Energy curve for phase-aware planning. The first logged cycle includes Plus features free; subscribe afterward to keep them. Payment is charged to your Apple ID. Cancel anytime in Apple ID settings.

Your calendar shows what you have planned. Rhythma adds the context of how you may feel.

Cycle and ovulation predictions are estimates for informational and wellness purposes only. Rhythma is not a medical device and should not be used for diagnosis or contraception.

In-app Sources & Methodology (no purchase required) explains how estimates work and cites PubMed, NCBI Bookshelf, and ACOG. Open from Settings → Sources & Methodology, or via ⓘ on period / ovulation / energy estimates.

Privacy Policy: https://iulianaiagodka.github.io/Rhythma/privacy.html
Terms of Use (EULA): https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

---

## TestFlight Test Information

Paste into App Store Connect → TestFlight → Test Information.

### Beta App Description

Rhythma brings your menstrual cycle into your calendar.

Instead of tracking your cycle separately from the rest of your life, Rhythma lets you see your cycle alongside your actual plans and events — helping you understand how upcoming days may align with your energy, focus, workload, and social plans.

Track your cycle, view upcoming phases, and use your calendar to plan with your rhythm in mind.

### Feedback Email

iuliana.iagodka@gmail.com

### What to Test

• Record a period from Today and from the year calendar (confirm / remove)
• Confirm predicted cycle day / predicted ovulation labels on forecast dates
• Turn on Calendar sync; confirm events appear next to the cycle
• Switch Light / Dark theme
• **Paid path:** first cycle keeps Plus free; after a second period start, Plus locks until purchase or Restore (Sandbox)
• On TestFlight builds: Free / Plus switch and QA monetization toggles in Settings
• Confirm the app follows English or Ukrainian from the iPhone language
• Open **Settings → Sources & Methodology** (no Plus purchase required)

No sign-in. Reviewers can open the app and use it immediately.

---

## ASO version

### Promo Text

Track your period, sync your calendar, and plan events around your cycle — simply and privately.

### Description

Rhythma is a cycle tracker built around your daily life.

Record your period, connect your iPhone calendar, and see how your energy and capacity align with what you have planned. Use your cycle as a planning tool for work, rest, and social life.

#### RECORD YOUR PERIOD IN ONE TAP
Add the first day of your period instantly from Today, or tap another date on the year calendar and confirm.

#### ANNUAL CYCLE CALENDAR
View a full year of your recorded and predicted cycle days in one clear calendar.

#### PRIVATE PERIOD TRACKER
All data stays on your iPhone. No sign-up, no cloud sync, no unnecessary complexity.

#### CALENDAR SYNC — FREE
Connect your iPhone calendar to see events alongside your cycle.

#### RHYTHMA PLUS
First cycle free. Then unlock Cycle insight, Schedule insight, and Energy curve with a monthly or yearly subscription. Restore anytime. Cancel in Apple ID settings.

Privacy Policy: https://iulianaiagodka.github.io/Rhythma/privacy.html
Terms of Use (EULA): https://www.apple.com/legal/internet-services/itunes/dev/stdeula/

#### LIGHT OR DARK THEME
Personalise your appearance. Available in English and Ukrainian.

Rhythma provides estimates only. It does not offer medical advice and should not be used as contraception.

---

## Suggested keywords

period tracker,cycle tracker,period calendar,menstrual cycle,cycle calendar,period log,women health

---

## In-App Purchase / Subscription

- **Type:** Auto-Renewable Subscriptions (same subscription group)
- **Subscription Group:** Rhythma Plus
- **Products:**
  - **Monthly** — Product ID `app.rhythma.cycle.plus.monthly`, duration 1 month
  - **Yearly** — Product ID `app.rhythma.cycle.plus.yearly`, duration 1 year
- **Display Name:** Rhythma Plus
- **Description:** Unlock Cycle insight, Schedule insight, and Energy curve after your free first cycle. Cancel anytime.
- **Price (USD base for ASC setup):**
  - Monthly: **$2.99**
  - Yearly: **$14.99**
  - In ASC pick the matching price tiers; other storefronts (including PLN) localize automatically. **No separate Founder SKU** for this launch — one monthly + one yearly for everyone.
- **Free access:** First logged cycle includes Plus features; paywall from the second logged period start when monetization is on.
- **Tax category:** Fitness and Health (or Match to parent app if the app is Health & Fitness)
- **Builds:** App Store `production` includes `EXPO_PUBLIC_IAP_PLUS=1` and `EXPO_PUBLIC_MONETIZATION=1`. Attach **both** subscriptions to the version before submit.
- **ASC tip:** Do not reuse `app.rhythma.cycle.plus` — that ID was used by a deleted Non-Consumable and cannot be reclaimed.
- **Review links:** Privacy `https://iulianaiagodka.github.io/Rhythma/privacy.html` · Terms (EULA) `https://www.apple.com/legal/internet-services/itunes/dev/stdeula/`

---

## Notes

- Current App Store Connect app ID: `6802549751`
- Bundle ID: `app.rhythma.cycle`
- Support URL: `https://iulianaiagodka.github.io/Rhythma/`
- Privacy Policy URL: `https://iulianaiagodka.github.io/Rhythma/privacy.html`
- Terms of Use (EULA): `https://www.apple.com/legal/internet-services/itunes/dev/stdeula/`
  - With **Apple’s Standard License Agreement**, Apple still requires this **functional link in the App Description** (visible on the product page). Put it on its own line near Privacy Policy.
  - Custom EULA would instead be uploaded under App Information → License Agreement.
- No fertility or ovulation focus — the product is about integrating the cycle into daily planning.
- iPhone only (iPad support is off).
- Copyright: © 2026 Iuliana Iagodka
- Production profile: IAP + monetization on (free first cycle, then paywall). TestFlight may show a Free / Plus QA switch.
- **App Review (Guideline 1.4.1):** Citations are in-app without purchase — **Settings → Sources & Methodology** (methodology-first sheet with short tappable citations). Reply in Resolution Center if asked.
- **Calendar Full Access:** iOS calls this “Full Access” because it does not provide a read-only Calendar permission. Rhythma only reads events to show them in the app. It does not create, edit, or delete your calendar events. Explained under the allow Full Access step in Support, in Settings, and in Privacy Policy.
