# Rhythma

A private cycle tracker that helps you plan life around your rhythm — events, training, and rest. Data stays on the phone. No account.

This is not a fertility app. The focus is logging your cycle and adapting your calendar to the current phase.

## Free

- Log the first day of your period
- Week and year calendars for recorded and forecasted period days
- Light / dark theme
- English and Ukrainian, based on the phone language

## Pro

- Calendar sync for events and workouts
- Load advice: whether this week fits the current phase
- Day highlighting when the schedule is too heavy or too light for the phase
- Phase name on Today (`Rest & release`, `Renew & rise`, `Peak & powerful`, `Turn inward`)
- Best / avoid lists for adapting the calendar to the phase

## Dev

Local Expo (`__DEV__`) and the EAS `development` profile unlock **every** feature.

Production / TestFlight stays on Free until a purchase is added.

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
