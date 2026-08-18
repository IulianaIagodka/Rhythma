# Rhythma

A private cycle tracker that helps you plan life around your rhythm — events, training, and rest. Data stays on the phone. No account.

This is not a fertility app. The focus is logging your cycle and adapting your calendar to the current phase.

## Free

- Log the first day of your period from Today, or confirm a date on the year calendar
- Week and year calendars for recorded and forecasted period days
- Phase name on Today (`Rest & release`, `Renew & rise`, `Peak & powerful`, `Turn inward`)
- Optional ovulation marks on the calendars
- Dark theme by default, with a light-mode switch
- English and Ukrainian, based on the phone language

## Plus

- Calendar sync for events and workouts
- Load recommendations, with a switch to hide them
- Day highlighting when the schedule is too heavy or too light for the phase
- Phase chips for what may support you now and what may feel harder, with a switch to hide them
- Cycle rhythm: a compact four-phase sparkline to the right of cycle day, with a today marker

## Builds

- `production` — Free TestFlight / App Store. Plus features stay locked.
- `plus` — TestFlight preview with Plus unlocked.
- `preview` — TestFlight build with a Free / Plus switch in Settings.
- `internal` — installable from a phone link, without TestFlight. Register the iPhone first with `eas device:create`.
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

- [Support page](docs/support.md)
- [Privacy policy](docs/privacy.md)
- Email: [iuliana.iagodka@gmail.com](mailto:iuliana.iagodka@gmail.com)

## Privacy

Cycle data is stored locally with AsyncStorage. Calendar access is read-only and only used when Plus calendar sync is enabled.

## iOS

Bundle ID: `app.rhythma.cycle`  
App Store Connect: `6802549751`  
iPhone only (iPad is off for now)
