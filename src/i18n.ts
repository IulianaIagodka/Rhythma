import { getLocales } from 'expo-localization';

export type Language = 'uk' | 'en';

export function detectLanguage(): Language {
  const locale = getLocales()[0];
  const code = locale?.languageCode?.toLowerCase() ?? locale?.languageTag?.toLowerCase() ?? 'en';
  return code.startsWith('uk') ? 'uk' : 'en';
}

export const copy = {
  uk: {
    appName: 'Rhythma',
    todayHeader: 'Ваш ритм сьогодні',
    logCycle: 'Запишіть цикл',
    logCycleSub: 'Перший день місячних — і Rhythma звірить навантаження з календарем',
    cycleDay: 'День циклу',
    nextAfterRecords: 'Наступні місячні зʼявляться після кількох записів',
    nextToday: 'Місячні очікуються сьогодні',
    nextIn: 'Наступні місячні через ~{days} дн.',
    startedToday: 'Місячні почалися сьогодні',
    cancelToday: 'Скасувати запис на сьогодні',
    chooseOtherDate: 'Обрати іншу дату',
    thisWeek: 'Цей тиждень',
    calendarTag: 'Календар',
    cycleTag: 'Цикл',
    syncCalendar: 'Синхронізація календаря',
    syncPhone: 'Події та тренування з телефону',
    eventsOnWeek: '{count} подій на тижні',
    readingEvents: 'Зчитую події…',
    calendarPermissionHint: 'Дозвіл не надано — відкрийте Налаштування → Rhythma → Календар',
    cycleCalendar: 'Календар циклу',
    settings: 'Налаштування',
    calendar: 'Календар',
    calendarDesc: 'Читає події й тренування з телефону',
    periodForecast: 'Прогноз місячних',
    forecastDesc: 'Рожева смужка наступних місячних',
    darkTheme: 'Темна тема',
    todayTab: 'Сьогодні',
    yearTab: 'Рік',
    moreTab: 'Ще',
    eventsToday: 'Сьогодні: {events} под. · {workouts} трен.',
    noEventsWeek: 'Подій на цьому тижні немає.',
    noCalendars: 'Не знайдено жодного календаря на телефоні.',
    noPermission: 'Немає дозволу — відкрийте Налаштування → Rhythma → Календар → Повний доступ.',
    eventFallback: 'Подія',
    selectedDay: 'Обраний день',
    noEventsForDay: 'На цей день подій або тренувань немає.',
    workouts: 'Тренування',
    events: 'Події',
  },
  en: {
    appName: 'Rhythma',
    todayHeader: 'Your rhythm today',
    logCycle: 'Log your cycle',
    logCycleSub: 'Record the first day of your period and compare your load with your calendar',
    cycleDay: 'Cycle day',
    nextAfterRecords: 'Your next period will appear after a few records',
    nextToday: 'Your period is expected today',
    nextIn: 'Next period in ~{days} days',
    startedToday: 'Period started today',
    cancelToday: 'Remove today\'s entry',
    chooseOtherDate: 'Choose another date',
    thisWeek: 'This week',
    calendarTag: 'Calendar',
    cycleTag: 'Cycle',
    syncCalendar: 'Calendar sync',
    syncPhone: 'Events and workouts from your phone',
    eventsOnWeek: '{count} events this week',
    readingEvents: 'Reading events…',
    calendarPermissionHint: 'Permission denied — open Settings → Rhythma → Calendars',
    cycleCalendar: 'Cycle calendar',
    settings: 'Settings',
    calendar: 'Calendar',
    calendarDesc: 'Reads events and workouts from your phone',
    periodForecast: 'Period forecast',
    forecastDesc: 'Pink bar for upcoming period days',
    darkTheme: 'Dark theme',
    todayTab: 'Today',
    yearTab: 'Year',
    moreTab: 'More',
    eventsToday: 'Today: {events} events · {workouts} workouts',
    noEventsWeek: 'No events found this week.',
    noCalendars: 'No calendars were found on this phone.',
    noPermission: 'No permission — open Settings → Rhythma → Calendars → Full Access.',
    eventFallback: 'Event',
    selectedDay: 'Selected day',
    noEventsForDay: 'No events or workouts found for this day.',
    workouts: 'Workouts',
    events: 'Events',
  },
} as const;

export function t(lang: Language, key: keyof typeof copy.uk, vars?: Record<string, string | number>): string {
  let text = String(copy[lang][key] ?? copy.en[key]);
  if (!vars) return text;
  for (const [k, v] of Object.entries(vars)) {
    text = text.replace(`{${k}}`, String(v));
  }
  return text;
}
