# Rhythma

A private cycle tracker that helps you plan life around your rhythm — events and rest. Data stays on the phone. No account.

This is not a fertility app. The focus is logging your cycle and adapting your calendar to the current phase.

## Free

- Log the first day of your period from Today, or confirm a date on the year calendar
- Week and year calendars for recorded and forecasted period days (9 months visible, scroll for the rest)
- Phase name on Today (`Rest & release`, `Renew & rise`, `Peak & powerful`, `Turn inward`)
- **Calendar sync** for events from the iPhone Calendar
- Optional ovulation marks on the calendars
- Theme switch: Light / Dark
- English and Ukrainian, based on the phone language

## Plus — Coming soon

- Recommendations (load advice for the current phase)
- Phase tips (Yes / No for this phase)
- Energy curve (smooth sparkline; tap to open energy with estrogen and progesterone)

Purchase will be available behind the `EXPO_PUBLIC_IAP_PLUS` flag (`eas` profile `plus`).

## Builds

- `production` — App Store / TestFlight. No purchase UI (Coming soon). TestFlight installs may show a Free / Plus switch for QA.
- `testflight` — same as production, with an explicit Free / Plus switch (`EXPO_PUBLIC_PLAN_SWITCH=1`).
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
