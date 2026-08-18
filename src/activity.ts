import type { CalendarItem } from './calendar';
import type { PhaseId } from './cycle';
import { weekdayName, type Language } from './dates';

export type Fit = 'low' | 'ok' | 'high';

export type LoadAdvice = {
  title: string;
  note: string;
  fit: Fit;
  busiestDay: string | null;
  events: number;
  workouts: number;
};

export type Capacity = {
  label: string;
  load: 'low' | 'medium' | 'high';
  hint: string;
};

export function capacityForPhase(phase: PhaseId | null, lang: Language): Capacity {
  if (lang === 'uk') {
    if (phase === 'menstrual') return { label: 'Відновлення', load: 'low', hint: 'легке навантаження, сон, прогулянки' };
    if (phase === 'follicular') return { label: 'Набір', load: 'medium', hint: 'можна додавати тренування й нові плани' };
    if (phase === 'ovulatory') return { label: 'Пік', load: 'high', hint: 'складні тренування, зустрічі, рішення' };
    if (phase === 'luteal') return { label: 'Спад', load: 'medium', hint: 'завершуйте, не додавайте пік навантаження' };
    return { label: 'Цикл', load: 'medium', hint: 'позначте перший день, щоб оцінити навантаження' };
  }
  if (phase === 'menstrual') return { label: 'Recovery', load: 'low', hint: 'lighter load, sleep, walks' };
  if (phase === 'follicular') return { label: 'Build', load: 'medium', hint: 'good time to add workouts and new plans' };
  if (phase === 'ovulatory') return { label: 'Peak', load: 'high', hint: 'hard sessions, meetings, decisions' };
  if (phase === 'luteal') return { label: 'Ease down', load: 'medium', hint: 'finish things, avoid adding peak load' };
  return { label: 'Cycle', load: 'medium', hint: 'log your first day to evaluate load' };
}

export function adviseLoad(phase: PhaseId | null, items: CalendarItem[], lang: Language): LoadAdvice {
  const capacity = capacityForPhase(phase, lang);
  const workouts = items.filter((item) => item.kind === 'workout').length;
  const events = items.length;
  const byDay = new Map<string, number>();
  for (const item of items) {
    byDay.set(item.day, (byDay.get(item.day) ?? 0) + (item.kind === 'workout' ? 2 : 1));
  }
  const busiest = [...byDay.entries()].sort((a, b) => b[1] - a[1])[0];
  const busiestDay = busiest ? weekdayName(busiest[0], lang) : null;

  let fit: Fit = 'ok';
  if (!items.length) {
    return {
      title: capacity.label,
      note: lang === 'uk' ? `${capacity.hint}. Підключіть календар, щоб звірити події й тренування.` : `${capacity.hint}. Connect your calendar to compare events and workouts.`,
      fit: 'ok',
      busiestDay: null,
      events: 0,
      workouts: 0,
    };
  }

  if (capacity.load === 'low' && (workouts >= 2 || events >= 5)) fit = 'high';
  else if (capacity.load === 'medium' && workouts >= 4) fit = 'high';
  else if (capacity.load === 'high' && events === 0 && workouts === 0) fit = 'low';
  else if (capacity.load === 'high' && workouts === 0 && events < 2) fit = 'low';

  const note =
    fit === 'high'
      ? (lang === 'uk' ? `На цьому тижні ${events} под. / ${workouts} трен. — більше, ніж зараз добре тримає цикл. Зменшіть інтенсивність.` : `This week has ${events} events / ${workouts} workouts — more than your cycle is likely to support well right now. Reduce intensity.`)
      : fit === 'low'
        ? (lang === 'uk' ? `Подій мало (${events}), тренувань ${workouts}. Цикл зараз тримає більше — можна додати рух або зустрічі.` : `There is little planned (${events} events, ${workouts} workouts). Your cycle can likely support more right now — you can add movement or meetings.`)
        : (lang === 'uk' ? `На цьому тижні ${events} под. / ${workouts} трен. — навантаження відповідає циклу. ${capacity.hint}.` : `This week has ${events} events / ${workouts} workouts — the load fits your cycle. ${capacity.hint}.`);

  return {
    title: busiestDay ? (lang === 'uk' ? `${capitalize(busiestDay)} — найнасиченіший день` : `${capitalize(busiestDay)} is the busiest day`) : capacity.label,
    note,
    fit,
    busiestDay,
    events,
    workouts,
  };
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
