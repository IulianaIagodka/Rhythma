import type { ActivityKind, CalendarItem } from './calendarItems';
import type { PhaseId } from './cycle';
import { weekdayName, type Language } from './dates';

export type Fit = 'low' | 'ok' | 'high';

export type LoadAdvice = {
  title: string;
  note: string;
  fit: Fit;
  busiestDay: string | null;
  events: number;
};

export type Capacity = {
  label: string;
  load: 'low' | 'medium' | 'high';
  hint: string;
  calendarHint: string;
};

export type ActivityFit = 'support' | 'harder' | 'neutral';

export function activityLoad(activity: ActivityKind): number {
  return activity === 'intense' ? 2 : 1;
}

export function activityFitForPhase(phase: PhaseId | null, activity: ActivityKind): ActivityFit {
  if (activity === 'event') return 'neutral';
  if (phase === 'menstrual' || phase === 'luteal') {
    return activity === 'intense' ? 'harder' : 'support';
  }
  return 'support';
}

export function activityFitLabel(
  phase: PhaseId | null,
  activity: ActivityKind,
  lang: Language,
): string | null {
  const fit = activityFitForPhase(phase, activity);
  if (fit === 'support') return lang === 'uk' ? 'ок зараз' : 'okay now';
  if (fit === 'harder') return lang === 'uk' ? 'краще перенести' : 'consider moving';
  return null;
}

function activityChecks(phase: PhaseId | null, items: CalendarItem[], lang: Language): string[] {
  const kinds = new Set(items.map((item) => item.activity));
  const uk = lang === 'uk';
  const checks: string[] = [];
  const restful = phase === 'menstrual' || phase === 'luteal';

  if (kinds.has('yoga')) checks.push(uk ? 'Йога — ок' : 'Yoga is okay');
  if (kinds.has('massage')) checks.push(uk ? 'Масаж — ок' : 'Massage is okay');
  if (kinds.has('swim')) checks.push(uk ? 'Плавання — ок' : 'Swimming is okay');
  if (kinds.has('gentle')) checks.push(uk ? 'Легкий рух — ок' : 'Light movement is okay');

  if (restful && kinds.has('intense')) {
    checks.push(uk ? 'Силове тренування краще перенести' : 'Consider moving hard training');
  } else if (!restful && kinds.has('intense')) {
    checks.push(uk ? 'Тренування пасує до фази' : 'Training fits this phase');
  }

  const hasGentleMove = kinds.has('yoga') || kinds.has('swim') || kinds.has('gentle') || kinds.has('massage');
  if (restful && !kinds.has('intense') && !hasGentleMove) {
    checks.push(uk ? 'Можна додати легке тренування' : 'You could add a light session');
  }
  if (!restful && phase === 'ovulatory' && !kinds.has('intense')) {
    checks.push(uk ? 'Можна додати тренування' : 'You could add training');
  }
  if (!restful && phase === 'follicular' && !kinds.has('intense') && !hasGentleMove) {
    checks.push(uk ? 'Можна додати тренування' : 'You could add training');
  }

  return checks;
}

export type PhasePlan = {
  best: string[];
  avoid: string[];
};

/** Factual phase name for status UI (Cycle card) — not a recommendation label. */
export function phaseStatusLabel(phase: PhaseId | null, lang: Language): string {
  if (lang === 'uk') {
    if (phase === 'menstrual') return 'Менструальна фаза';
    if (phase === 'follicular') return 'Фолікулярна фаза';
    if (phase === 'ovulatory') return 'Овуляторна фаза';
    if (phase === 'luteal') return 'Лютеїнова фаза';
    return 'Цикл';
  }
  if (phase === 'menstrual') return 'Menstrual phase';
  if (phase === 'follicular') return 'Follicular phase';
  if (phase === 'ovulatory') return 'Ovulatory phase';
  if (phase === 'luteal') return 'Luteal phase';
  return 'Cycle';
}

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
  const events = items.length;
  const intense = items.filter((item) => item.activity === 'intense').length;
  const byDay = new Map<string, number>();
  for (const item of items) {
    byDay.set(item.day, (byDay.get(item.day) ?? 0) + activityLoad(item.activity));
  }
  const busiest = [...byDay.entries()].sort((a, b) => b[1] - a[1])[0];
  const busiestDay = busiest ? weekdayName(busiest[0], lang) : null;

  let fit: Fit = 'ok';
  if (!items.length) {
    const emptyChecks = activityChecks(phase, items, lang);
    return {
      title: capacity.label,
      note: joinAdviceParts([...emptyChecks, capacity.hint, capacity.calendarHint]),
      fit: phase === 'ovulatory' ? 'low' : 'ok',
      busiestDay: null,
      events: 0,
    };
  }

  if (capacity.load === 'low' && (intense >= 1 || events >= 5)) fit = 'high';
  else if (capacity.load === 'medium' && intense >= 4) fit = 'high';
  else if (capacity.load === 'high' && intense === 0 && events < 2) fit = 'low';

  return {
    title: busiestDay ? reviewBusiestDayNote(busiestDay, lang) : capacity.label,
    note: busiestDay ? '' : joinAdviceParts([capacity.hint, capacity.calendarHint]),
    fit,
    busiestDay,
    events,
  };
}

/** Phase-only insight when calendar sync is off — no event or calendar copy. */
export function cycleInsight(phase: PhaseId | null, lang: Language): LoadAdvice {
  const capacity = capacityForPhase(phase, lang);
  return {
    title: capacity.label,
    note: joinAdviceParts([capacity.hint]),
    fit: phase === 'ovulatory' ? 'low' : 'ok',
    busiestDay: null,
    events: 0,
  };
}

function joinAdviceParts(parts: string[]): string {
  const cleaned = parts.map((part) => part.trim()).filter(Boolean);
  if (!cleaned.length) return '';
  const body = cleaned.join('. ').replace(/\.\s*\./g, '.');
  return /[.!?]$/.test(body) ? body : `${body}.`;
}

export type DayAlignment = 'under' | 'fit' | 'over';

export function dayAlignmentForPhase(phase: PhaseId | null, items: CalendarItem[]): DayAlignment {
  const capacity = capacityForPhase(phase, 'en');
  const loadScore = items.reduce((sum, item) => sum + activityLoad(item.activity), 0);

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
        best: ['Відновлення', 'Легкий рух', 'Буфер між зустрічами'],
        avoid: ['Висока інтенсивність', 'Щільний графік', 'Пізні вечори'],
      };
    }
    if (phase === 'follicular') {
      return {
        best: ['Нові старти', 'Тренування з прогресією', 'Брейншторми'],
        avoid: ['Відкладати старти', 'Надмірний простій'],
      };
    }
    if (phase === 'ovulatory') {
      return {
        best: ['Ключові розмови', 'Соціальні плани', 'Інтенсивні сесії'],
        avoid: ['Ізоляція', 'Дрібні задачі'],
      };
    }
    if (phase === 'luteal') {
      return {
        best: ['Закривати почате', 'Простіший графік', 'Більше буфера'],
        avoid: ['Великі зобовʼязання', 'Пік навантаження'],
      };
    }
    return { best: [], avoid: [] };
  }
  if (phase === 'menstrual') {
    return {
      best: ['Recovery', 'Light movement', 'Meeting buffers'],
      avoid: ['High intensity', 'Packed schedule', 'Late nights'],
    };
  }
  if (phase === 'follicular') {
    return {
      best: ['New starts', 'Progressive training', 'Brainstorms'],
      avoid: ['Delayed starts', 'Idle time'],
    };
  }
  if (phase === 'ovulatory') {
    return {
      best: ['Key conversations', 'Social plans', 'Intense sessions'],
      avoid: ['Isolation', 'Busywork'],
    };
  }
  if (phase === 'luteal') {
    return {
      best: ['Close loops', 'Simpler schedule', 'Extra buffer'],
      avoid: ['Big commitments', 'Peak load'],
    };
  }
  return { best: [], avoid: [] };
}

function reviewBusiestDayNote(dayName: string, lang: Language): string {
  if (lang === 'uk') {
    const accusative: Record<string, string> = {
      неділя: 'неділю',
      понеділок: 'понеділок',
      вівторок: 'вівторок',
      середа: 'середу',
      четвер: 'четвер',
      "п'ятниця": "п'ятницю",
      субота: 'суботу',
    };
    return `Перегляньте плани на ${accusative[dayName] ?? dayName}`;
  }
  return `Review your ${capitalize(dayName)}'s plans`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
