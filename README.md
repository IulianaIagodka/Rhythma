# Rhythma

A private cycle tracker that helps you plan life around your rhythm — events, training, and rest. Data stays on the phone. No account.

This is not a fertility app. The focus is logging your cycle and adapting your calendar to the current phase.

## Free

- Log the first day of your period from Today, or confirm a date on the year calendar
- Week and year calendars for recorded and forecasted period days
- Phase name on Today (`Rest & release`, `Renew & rise`, `Peak & powerful`, `Turn inward`)
- Optional ovulation marks on the calendars
- Light / dark theme
- English and Ukrainian, based on the phone language

## Pro

- Calendar sync for events and workouts
- Events and load advice, with a switch to hide them
- Day highlighting when the schedule is too heavy or too light for the phase
- Best / avoid lists for adapting the calendar to the phase, with a switch to hide them

## Dev / TestFlight

Local Expo (`__DEV__`), the EAS `development` profile, and **TestFlight** unlock **every** feature.

The App Store binary will stay on Free once `EXPO_PUBLIC_UNLOCK_PRO` is removed from the production profile.

```bash
npm install
npx expo start
```

```bash
npm test
npx tsc --noEmit
```

## Privacy

Cycle data is stored locally with AsyncStorage. Calendar access is read-only and only used when Pro calendar sync is enabled.

## iOS

Bundle ID: `app.rhythma.cycle`  
App Store Connect: `6802549751`
