import type { ActivityKind, CalendarItem } from './calendarItems';
import type { PhaseId } from './cycle';
import { weekdayName, type Language } from './dates';

export type Fit = 'low' | 'ok' | 'high';

export type LoadAdvice = {
  title: string;
  note: string;
  fit: Fit;
  busiestDay: string | null;
  busiestDayISO: string | null;
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
  if (fit === 'support') return lang === 'uk' ? 'Ок зараз' : 'Okay now';
  if (fit === 'harder') return lang === 'uk' ? 'Краще перенести' : 'Consider moving';
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
        hint: 'Естроген і прогестерон на мінімумі — енергія часто спадає',
        calendarHint: 'Краще відновлення й легкий рух; менше жорстких тренувань і щільних днів',
      };
    }
    if (phase === 'follicular') {
      return {
        label: 'Renew & rise',
        load: 'medium',
        hint: 'Естроген зростає — енергія, фокус і мотивація зазвичай підсилюються',
        calendarHint: 'Добрий час для нових планів, прогресивних тренувань і стартів',
      };
    }
    if (phase === 'ovulatory') {
      return {
        label: 'Peak & powerful',
        load: 'high',
        hint: 'Естроген на піку навколо овуляції — часто найбільше енергії',
        calendarHint: 'Ставте ключові розмови, соціальні плани й інтенсивні сесії',
      };
    }
    if (phase === 'luteal') {
      return {
        label: 'Turn inward',
        load: 'medium',
        hint: 'Після овуляції росте прогестерон — енергія може спадати',
        calendarHint: 'Закривайте почате, спрощуйте графік і залишайте буфер',
      };
    }
    return {
      label: 'Цикл',
      load: 'medium',
      hint: 'Запишіть перший день, щоб Rhythma визначила фазу',
      calendarHint: 'Після кількох записів зʼявляться підказки, що пасує до планів',
    };
  }
  if (phase === 'menstrual') {
    return {
      label: 'Rest & release',
      load: 'low',
      hint: 'Estrogen and progesterone are at their lowest — energy often dips',
      calendarHint: 'Favor recovery and light movement; ease off hard workouts and packed days',
    };
  }
  if (phase === 'follicular') {
    return {
      label: 'Renew & rise',
      load: 'medium',
      hint: 'Estrogen rises — energy, focus, and motivation usually build',
      calendarHint: 'A good window for new plans, progressive training, and starts',
    };
  }
  if (phase === 'ovulatory') {
    return {
      label: 'Peak & powerful',
      load: 'high',
      hint: 'Estrogen peaks around ovulation — many feel most energetic',
      calendarHint: 'Place key conversations, social plans, and intense sessions here',
    };
  }
  if (phase === 'luteal') {
    return {
      label: 'Turn inward',
      load: 'medium',
      hint: 'Progesterone rises after ovulation — energy may ease',
      calendarHint: 'Close loops, simplify the schedule, and leave more buffer',
    };
  }
  return {
    label: 'Cycle',
    load: 'medium',
    hint: 'Record the first day so Rhythma can map your phase',
    calendarHint: 'After a few records, you will get suggestions on what fits your plans',
  };
}

function schedulePlanLine(phase: PhaseId | null, lang: Language): string {
  const plan = planningForPhase(phase, lang);
  if (!plan.best.length && !plan.avoid.length) return '';
  if (lang === 'uk') {
    const parts: string[] = [];
    if (plan.best.length) parts.push(`Підходить: ${plan.best.join(', ')}`);
    if (plan.avoid.length) parts.push(`Краще уникати: ${plan.avoid.join(', ')}`);
    return parts.join('. ');
  }
  const parts: string[] = [];
  if (plan.best.length) parts.push(`Fits well: ${plan.best.join(', ')}`);
  if (plan.avoid.length) parts.push(`Ease off: ${plan.avoid.join(', ')}`);
  return parts.join('. ');
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
  const busiestDayISO = busiest ? busiest[0] : null;
  const busiestDay = busiestDayISO ? weekdayName(busiestDayISO, lang) : null;
  const checks = activityChecks(phase, items, lang);
  const planLine = schedulePlanLine(phase, lang);
  const scheduleNote = joinAdviceParts([...checks, planLine || capacity.calendarHint]);
  const emptyTitle = lang === 'uk' ? 'Що пасує цього тижня' : 'What fits this week';

  let fit: Fit = 'ok';
  if (!items.length) {
    return {
      title: emptyTitle,
      note: scheduleNote,
      fit: phase === 'ovulatory' ? 'low' : 'ok',
      busiestDay: null,
      busiestDayISO: null,
      events: 0,
    };
  }

  if (capacity.load === 'low' && (intense >= 1 || events >= 5)) fit = 'high';
  else if (capacity.load === 'medium' && intense >= 4) fit = 'high';
  else if (capacity.load === 'high' && intense === 0 && events < 2) fit = 'low';

  return {
    title: busiestDay ? reviewBusiestDayNote(busiestDay, lang) : emptyTitle,
    note: scheduleNote,
    fit,
    busiestDay,
    busiestDayISO,
    events,
  };
}

/** Phase and hormone insight — no calendar or activity recommendations. */
export function cycleInsight(phase: PhaseId | null, lang: Language): LoadAdvice {
  const capacity = capacityForPhase(phase, lang);
  const title =
    phase == null
      ? lang === 'uk'
        ? 'Ще немає запису місячних'
        : 'No period logged yet'
      : phaseStatusLabel(phase, lang);
  return {
    title,
    note: joinAdviceParts([capacity.hint]),
    fit: phase === 'ovulatory' ? 'low' : 'ok',
    busiestDay: null,
    busiestDayISO: null,
    events: 0,
  };
}

function capitalizeSentence(text: string): string {
  if (!text) return text;
  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}

function joinAdviceParts(parts: string[]): string {
  const cleaned = parts
    .map((part) => part.trim())
    .filter(Boolean)
    .map(capitalizeSentence);
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
