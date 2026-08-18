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
  calendarHint: string;
};

export function capacityForPhase(phase: PhaseId | null, lang: Language): Capacity {
  if (lang === 'uk') {
    if (phase === 'menstrual') {
      return {
        label: 'Rest & release',
        load: 'low',
        hint: 'гормони на мінімумі: більше сну, легкий рух, менше інтенсивності',
        calendarHint: 'залишайте у календарі простір, переносіть жорсткі тренування й важкі зустрічі, якщо можете',
      };
    }
    if (phase === 'follicular') {
      return {
        label: 'Renew & rise',
        load: 'medium',
        hint: 'енергія, креативність і мотивація ростуть',
        calendarHint: 'добрий час додавати нові плани, тренування, брейншторми й старт задач',
      };
    }
    if (phase === 'ovulatory') {
      return {
        label: 'Peak & powerful',
        load: 'high',
        hint: 'пік енергії: складні тренування, виступи, зустрічі, рішення',
        calendarHint: 'ставте сюди найважливіші розмови, соціальні події та інтенсивні сесії',
      };
    }
    if (phase === 'luteal') {
      return {
        label: 'Turn inward',
        load: 'medium',
        hint: 'прогестерон росте, енергія може спадати — потрібен буфер',
        calendarHint: 'краще закривати розпочате, спрощувати графік і не перевантажувати кінець циклу',
      };
    }
    return {
      label: 'Цикл',
      load: 'medium',
      hint: 'позначте перший день, щоб Rhythma звіряла фазу з навантаженням',
      calendarHint: 'після кількох записів зʼявляться підказки, як адаптувати календар під ваш ритм',
    };
  }
  if (phase === 'menstrual') {
    return {
      label: 'Rest & release',
      load: 'low',
      hint: 'hormones are lowest: favor sleep, walks, and lighter effort',
      calendarHint: 'keep more space in your calendar and move hard workouts or heavy meetings when possible',
    };
  }
  if (phase === 'follicular') {
    return {
      label: 'Renew & rise',
      load: 'medium',
      hint: 'energy, creativity, and motivation are climbing',
      calendarHint: 'good time to add new plans, training blocks, brainstorms, and starts',
    };
  }
  if (phase === 'ovulatory') {
    return {
      label: 'Peak & powerful',
      load: 'high',
      hint: 'energy tends to peak: use it for hard sessions, meetings, and decisions',
      calendarHint: 'place important conversations, social plans, and intense sessions here',
    };
  }
  if (phase === 'luteal') {
    return {
      label: 'Turn inward',
      load: 'medium',
      hint: 'progesterone rises and energy may dip, so leave more buffer',
      calendarHint: 'close loops, simplify the schedule, and avoid stacking the end of the cycle',
    };
  }
  return {
    label: 'Cycle',
    load: 'medium',
    hint: 'log your first day so Rhythma can map your phase against your load',
    calendarHint: 'after a few records, you will get suggestions on how to adapt your calendar',
  };
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
      note:
        lang === 'uk'
          ? `${capacity.hint}. ${capacity.calendarHint}. Підключіть календар, щоб звірити події й тренування.`
          : `${capacity.hint}. ${capacity.calendarHint}. Connect your calendar to compare events and workouts.`,
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
      ? (lang === 'uk'
          ? `На цьому тижні ${events} под. / ${workouts} трен. — це більше, ніж фаза зараз комфортно тримає. ${capacity.calendarHint}.`
          : `This week has ${events} events / ${workouts} workouts — more than this phase is likely to support comfortably. ${capacity.calendarHint}.`)
      : fit === 'low'
        ? (lang === 'uk'
            ? `Подій мало (${events}), тренувань ${workouts}. Ця фаза дозволяє більше — можна додати рух, зустрічі або важливі плани. ${capacity.calendarHint}.`
            : `There is little planned (${events} events, ${workouts} workouts). This phase can likely support more — you can add movement, meetings, or important plans. ${capacity.calendarHint}.`)
        : (lang === 'uk'
            ? `На цьому тижні ${events} под. / ${workouts} трен. — навантаження відповідає фазі. ${capacity.hint}. ${capacity.calendarHint}.`
            : `This week has ${events} events / ${workouts} workouts — the load fits this phase. ${capacity.hint}. ${capacity.calendarHint}.`);

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
