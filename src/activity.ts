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

/** Physical schedule load units — social/calendar events do not count. */
export function activityLoad(activity: ActivityKind): number {
  if (activity === 'intense') return 2;
  if (activity === 'event') return 0;
  return 1;
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

/** Short factual phase note for the free Today cycle card. */
export function phaseBriefDescription(phase: PhaseId | null, lang: Language): string | null {
  if (!phase) return null;
  return capacityForPhase(phase, lang).hint;
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

/** Quote a calendar event title in insight copy (uk «…», en “…”). */
function quotedEventTitle(title: string, lang: Language): string {
  const trimmed = title.trim();
  if (lang === 'uk') return `«${trimmed}»`;
  return `"${trimmed}"`;
}

function workoutInsightSentence(
  phase: PhaseId | null,
  item: CalendarItem,
  lang: Language,
): string {
  const title = quotedEventTitle(item.title, lang);
  if (lang === 'uk') {
    if (phase === 'menstrual' && item.activity === 'intense') {
      return `${title} — доволі важко під час місячних; можливо, варто полегшити або перенести`;
    }
    if (phase === 'menstrual') {
      return `${title} — легший варіант, добре зараз`;
    }
    if (phase === 'luteal' && item.activity === 'intense') {
      return `${title} може відчуватися важче в лютеїновій фазі — не форсіть`;
    }
    if (phase === 'follicular' && item.activity === 'intense') {
      return `${title} добре лягає на фолікулярну фазу — енергія зростає, тренування доречні`;
    }
    if (phase === 'ovulatory' && item.activity === 'intense') {
      return `${title} — хороший момент для інтенсивного навантаження`;
    }
    if (item.activity === 'intense') {
      return `${title} пасує до поточної фази`;
    }
    if (item.activity === 'yoga' || item.activity === 'massage' || item.activity === 'swim') {
      return `${title} — м’який рух, добре зараз`;
    }
    return `${title} — ок для цієї фази`;
  }

  if (phase === 'menstrual' && item.activity === 'intense') {
    return `${title} is a lot during your period — consider easing up or moving it`;
  }
  if (phase === 'menstrual') {
    return `${title} is a gentler option that fits right now`;
  }
  if (phase === 'luteal' && item.activity === 'intense') {
    return `${title} may feel heavy in the luteal phase — ease off if needed`;
  }
  if (phase === 'follicular' && item.activity === 'intense') {
    return `${title} fits your follicular phase — energy is building, so training works well`;
  }
  if (phase === 'ovulatory' && item.activity === 'intense') {
    return `${title} is a good moment for harder training`;
  }
  if (item.activity === 'intense') {
    return `${title} fits this phase`;
  }
  if (item.activity === 'yoga' || item.activity === 'massage' || item.activity === 'swim') {
    return `${title} is gentle movement — a good fit now`;
  }
  return `${title} works for this phase`;
}

function socialInsightSentence(
  items: CalendarItem[],
  hasWorkoutSameDay: boolean,
  lang: Language,
): string {
  if (!items.length) return '';
  const titles = items.map((item) => quotedEventTitle(item.title, lang));
  const joined =
    titles.length === 1
      ? titles[0]
      : titles.length === 2
        ? `${titles[0]} і ${titles[1]}`
        : `${titles[0]} і ще ${titles.length - 1}`;

  if (lang === 'uk') {
    if (hasWorkoutSameDay) {
      return `${joined} — легкий план; після тренування не ускладнюйте день`;
    }
    return `${joined} — спокійний соціальний план без зайвого навантаження`;
  }

  if (hasWorkoutSameDay) {
    if (titles.length === 1) {
      return `${titles[0]} is light — keep the rest of the day easy after training`;
    }
    return `${titles.join(' and ')} are light — keep the rest of the day easy after training`;
  }
  if (titles.length === 1) {
    return `${titles[0]} is an easy social plan`;
  }
  return `${titles.join(' and ')} are easy social plans`;
}

function emptyWeekInsight(phase: PhaseId | null, lang: Language): string {
  if (lang === 'uk') {
    if (phase === 'menstrual') {
      return 'Календар поки порожній — час для відновлення й легкого руху, без щільних днів';
    }
    if (phase === 'follicular') {
      return 'Мало планів цього тижня — енергія зростає, можна додати тренування або новий старт';
    }
    if (phase === 'ovulatory') {
      return 'Тиждень майже вільний — зараз добрий час для ключових справ чи інтенсивного тренування';
    }
    if (phase === 'luteal') {
      return 'Мало подій — закрийте відките й не набивайте дні зайвим';
    }
    return capacityForPhase(phase, lang).calendarHint;
  }

  if (phase === 'menstrual') {
    return 'Your calendar is quiet — favor recovery and light movement over packed days';
  }
  if (phase === 'follicular') {
    return 'Not much on this week yet — energy is rising, so you could add training or a new start';
  }
  if (phase === 'ovulatory') {
    return 'A light week — a good window for key plans or harder training';
  }
  if (phase === 'luteal') {
    return 'Few plans so far — close what is open and avoid overfilling the week';
  }
  return capacityForPhase(phase, lang).calendarHint;
}

function weekLoadHint(
  phase: PhaseId | null,
  items: CalendarItem[],
  busiestDayISO: string | null,
  lang: Language,
): string | null {
  const otherIntense = items.filter(
    (item) => item.activity === 'intense' && item.day !== busiestDayISO,
  );
  if (otherIntense.length === 0) return null;

  if (lang === 'uk') {
    if (phase === 'menstrual' || phase === 'luteal') {
      return 'Ще кілька тренувань цього тижня — залиште між ними час на відновлення';
    }
    return 'Ще кілька тренувань цього тижня — не забудьте про відновлення між ними';
  }

  if (phase === 'menstrual' || phase === 'luteal') {
    return 'A few more workouts this week — leave recovery time between them';
  }
  return 'A few more workouts this week — build in recovery between sessions';
}

/** Human schedule insight from real calendar titles — not abstract phase lists. */
function humanScheduleNote(
  phase: PhaseId | null,
  items: CalendarItem[],
  busiestDayISO: string | null,
  lang: Language,
): string {
  if (!items.length) {
    return emptyWeekInsight(phase, lang);
  }

  const dayItems = busiestDayISO
    ? items.filter((item) => item.day === busiestDayISO)
    : items;
  const workouts = dayItems.filter((item) => item.activity !== 'event');
  const social = dayItems.filter((item) => item.activity === 'event');
  const parts: string[] = [];

  for (const workout of workouts) {
    parts.push(workoutInsightSentence(phase, workout, lang));
  }
  if (social.length) {
    parts.push(socialInsightSentence(social, workouts.length > 0, lang));
  }

  const weekHint = weekLoadHint(phase, items, busiestDayISO, lang);
  if (weekHint) parts.push(weekHint);

  if (!parts.length) {
    return emptyWeekInsight(phase, lang);
  }

  return joinAdviceParts(parts);
}

export function adviseLoad(phase: PhaseId | null, items: CalendarItem[], lang: Language): LoadAdvice {
  const capacity = capacityForPhase(phase, lang);
  const events = items.length;
  const intense = items.filter((item) => item.activity === 'intense').length;
  const loadByDay = new Map<string, number>();
  const countByDay = new Map<string, number>();
  for (const item of items) {
    loadByDay.set(item.day, (loadByDay.get(item.day) ?? 0) + activityLoad(item.activity));
    countByDay.set(item.day, (countByDay.get(item.day) ?? 0) + 1);
  }
  const byLoad = [...loadByDay.entries()].filter(([, load]) => load > 0).sort((a, b) => b[1] - a[1]);
  const byCount = [...countByDay.entries()].sort((a, b) => b[1] - a[1]);
  const busiest = byLoad[0] ?? byCount[0];
  const busiestDayISO = busiest ? busiest[0] : null;
  const busiestDay = busiestDayISO ? weekdayName(busiestDayISO, lang) : null;
  const scheduleNote = humanScheduleNote(phase, items, busiestDayISO, lang);
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

  const physicalLoad = items.reduce((sum, item) => sum + activityLoad(item.activity), 0);
  if (capacity.load === 'low' && (intense >= 1 || physicalLoad >= 4 || events >= 5)) fit = 'high';
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

/** Join advice sentences with consistent punctuation. */
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
