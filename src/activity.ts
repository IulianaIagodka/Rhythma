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

export type DayAlignment = 'under' | 'fit' | 'over';

export type PhasePlan = {
  best: string[];
  avoid: string[];
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

export function dayAlignmentForPhase(phase: PhaseId | null, items: CalendarItem[]): DayAlignment {
  const capacity = capacityForPhase(phase, 'en');
  const loadScore = items.reduce((sum, item) => sum + (item.kind === 'workout' ? 2 : 1), 0);

  if (capacity.load === 'low') {
    return loadScore >= 3 ? 'over' : 'fit';
  }

  if (capacity.load === 'medium') {
    if (loadScore >= 5) return 'over';
    if (loadScore === 0) return 'under';
    return 'fit';
  }

  if (loadScore >= 6) return 'over';
  if (loadScore <= 1) return 'under';
  return 'fit';
}

export function planningForPhase(phase: PhaseId | null, lang: Language): PhasePlan {
  if (lang === 'uk') {
    if (phase === 'menstrual') {
      return {
        best: ['Сон і відновлення', 'Прогулянки, легка йога', 'Буфер між зустрічами'],
        avoid: ['HIIT і силові піки', 'Щільні переговори', 'Пізні вечори'],
      };
    }
    if (phase === 'follicular') {
      return {
        best: ['Нові плани й старти', 'Тренування з прогресією', 'Брейншторми, навчання'],
        avoid: ['Відкладати важливі старти', 'Надмірний простій'],
      };
    }
    if (phase === 'ovulatory') {
      return {
        best: ['Ключові розмови й рішення', 'Соціальні події', 'Інтенсивні сесії'],
        avoid: ['Ізоляція без потреби', 'Дрібні задачі замість важливих'],
      };
    }
    if (phase === 'luteal') {
      return {
        best: ['Закривати почате', 'Спрощений графік', 'Більше буфера перед місячними'],
        avoid: ['Нові великі зобовʼязання', 'Пік навантаження в кінці циклу'],
      };
    }
    return { best: [], avoid: [] };
  }
  if (phase === 'menstrual') {
    return {
      best: ['Sleep and recovery', 'Walks, light yoga', 'Buffer between meetings'],
      avoid: ['HIIT and peak strength', 'Back-to-back negotiations', 'Late nights'],
    };
  }
  if (phase === 'follicular') {
    return {
      best: ['New plans and starts', 'Progressive training', 'Brainstorms and learning'],
      avoid: ['Delaying important starts', 'Unnecessary idle time'],
    };
  }
  if (phase === 'ovulatory') {
    return {
      best: ['Key conversations and decisions', 'Social plans', 'Intense sessions'],
      avoid: ['Unnecessary isolation', 'Busywork instead of important work'],
    };
  }
  if (phase === 'luteal') {
    return {
      best: ['Close open loops', 'A simpler schedule', 'More buffer before your period'],
      avoid: ['New big commitments', 'Peak load at the end of the cycle'],
    };
  }
  return { best: [], avoid: [] };
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
