# Rhythma

A private cycle tracker that helps you plan life around your rhythm — events and rest. Data stays on the phone. No account.

This is not a fertility app. The focus is logging your cycle and adapting your calendar to the current phase.

## Free

- Record your period from Today, or confirm a date on the year calendar
- Week and year calendars for recorded and forecasted period days (9 months visible, scroll for the rest)
- Today cards: cycle status, this week, selected day, and phase context
- Phase name on Today (`Menstrual phase`, `Follicular phase`, `Ovulatory phase`, `Luteal phase`)
- **Predicted** labels for forecast cycle day and ovulation past the open logged cycle
- **Calendar sync** for events from the iPhone Calendar (including Google if added in iOS Calendar settings)
- Optional ovulation marks on the calendars
- **Sources** links to PubMed / NCBI / ACOG references (Settings → Sources & disclaimer; Today cycle card)
- Theme switch: Light / Dark
- English and Ukrainian, based on the phone language

## Plus — Coming soon

Purchase UI is off in the App Store release (`Coming soon`). Unlock later with `EXPO_PUBLIC_IAP_PLUS=1` / EAS profile `plus`.

- **Cycle insight** — short phase and hormone context
- **Schedule insight** — plan and activity fit when Calendar sync is on (with a Review link into Apple Calendar when helpful); CTA to connect the calendar when sync is off
- **Energy curve** — compact sparkline; tap for energy with estrogen and progesterone (axes: High/Low + phase names)

## Builds

- `production` — App Store. No purchase UI (**Coming soon**). No Free / Plus QA switch for App Store installs.
- `testflight` — same product bits as production, with an explicit Free / Plus switch (`EXPO_PUBLIC_PLAN_SWITCH=1`). TestFlight installs may also detect as TestFlight and show the switch.
- `plus` — enables in-app purchase UI (`EXPO_PUBLIC_IAP_PLUS=1`).
- `preview` / `internal` — Free / Plus switch via env.
- Local Expo (`__DEV__`) also shows the Free / Plus switch.

```bash
npm install
npx expo start
```

```bash
npm test
npx tsc --noEmit
```

```bash
# App Store / Coming soon
npx eas-cli build --platform ios --profile production --auto-submit --non-interactive
```

## Support

- [Support page](docs/support.md) · [GitHub Pages](https://iulianaiagodka.github.io/Rhythma/)
- [Privacy policy](docs/privacy.md)
- Email: [iuliana.iagodka@gmail.com](mailto:iuliana.iagodka@gmail.com)

## Privacy

Cycle data is stored locally with AsyncStorage. Calendar access is read-only and only used when Calendar sync is enabled.

## iOS

Bundle ID: `app.rhythma.cycle`  
App Store Connect: `6802549751`  
iPhone only (iPad is off for now)
