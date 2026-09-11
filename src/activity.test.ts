import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  activityLoad,
  adviseLoad,
  capacityForPhase,
  cycleInsight,
  dayAlignmentForPhase,
  isWeekPlanningDay,
  phaseBriefDescription,
  phaseStatusLabel,
  planningForPhase,
  weekPlanInsight,
} from './activity';
import { classifyActivity, classifyTitle, isPhysicalActivity, type CalendarItem } from './calendarItems';

function item(
  id: string,
  title: string,
  day: string,
  activity: CalendarItem['activity'],
): CalendarItem {
  return {
    id,
    title,
    day,
    activity,
    kind: isPhysicalActivity(activity) ? 'workout' : 'event',
    allDay: false,
    startMs: Date.parse(`${day}T09:00:00`),
    endMs: Date.parse(`${day}T10:00:00`),
  };
}

describe('classifyTitle', () => {
  it('marks workouts vs generic events', () => {
    assert.equal(classifyTitle('Gym'), 'workout');
    assert.equal(classifyTitle('Тренування ніг'), 'workout');
    assert.equal(classifyTitle('Йога 30'), 'workout');
    assert.equal(classifyTitle('Дзвінок з клієнтом'), 'event');
  });
});

describe('classifyActivity', () => {
  it('splits yoga, massage, swim and hard training', () => {
    assert.equal(classifyActivity('Йога 30'), 'yoga');
    assert.equal(classifyActivity('Масаж спини'), 'massage');
    assert.equal(classifyActivity('Плавання'), 'swim');
    assert.equal(classifyActivity('HIIT'), 'intense');
    assert.equal(classifyActivity('Meeting'), 'meeting');
    assert.equal(classifyActivity('Deep work'), 'focus');
    assert.equal(classifyActivity('Dinner with friends'), 'social');
  });

  it('recognizes martial arts and combat sports as intense load', () => {
    assert.equal(classifyActivity('Джиуджитсу дзюдо'), 'intense');
    assert.equal(classifyActivity('Jiu-Jitsu'), 'intense');
    assert.equal(classifyActivity('Бокс'), 'intense');
    assert.equal(classifyActivity('Karate class'), 'intense');
    assert.equal(classifyActivity('MMA sparring'), 'intense');
  });

  it('keeps unknown titles as plain events and birthdays as social', () => {
    assert.equal(classifyActivity('Bank appointment'), 'event');
    assert.equal(classifyActivity("Anita's birthday"), 'social');
  });
});

describe('activityLoad', () => {
  it('weights intense workouts higher and ignores meetings and social events', () => {
    assert.equal(activityLoad('intense'), 2);
    assert.equal(activityLoad('yoga'), 1);
    assert.equal(activityLoad('event'), 0);
    assert.equal(activityLoad('meeting'), 0);
    assert.equal(activityLoad('focus'), 0);
    assert.equal(activityLoad('social'), 0);
  });
});

describe('capacityForPhase', () => {
  it('keeps period as recovery and ovulation as peak', () => {
    assert.equal(capacityForPhase('menstrual', 'uk').load, 'low');
    assert.equal(capacityForPhase('ovulatory', 'uk').load, 'high');
    assert.match(capacityForPhase('luteal', 'uk').calendarHint, /спрощуйте графік|буфер/);
    assert.match(capacityForPhase('luteal', 'uk').hint, /прогестерон/);
  });
});

describe('phaseStatusLabel', () => {
  it('uses factual phase names, not recommendation labels', () => {
    assert.equal(phaseStatusLabel('luteal', 'en'), 'Luteal phase');
    assert.equal(phaseStatusLabel('menstrual', 'en'), 'Menstrual phase');
    assert.equal(phaseStatusLabel('follicular', 'uk'), 'Фолікулярна фаза');
    assert.equal(phaseStatusLabel('ovulatory', 'uk'), 'Овуляторна фаза');
    assert.notEqual(phaseStatusLabel('luteal', 'en'), capacityForPhase('luteal', 'en').label);
  });
});

describe('phaseBriefDescription', () => {
  it('returns a short hormone note for each phase', () => {
    assert.match(phaseBriefDescription('menstrual', 'uk')!, /енергія/);
    assert.match(phaseBriefDescription('follicular', 'en')!, /Estrogen rises/);
    assert.equal(phaseBriefDescription(null, 'en'), null);
  });
});

describe('adviseLoad', () => {
  it('flags hard training during period as a heavier fit', () => {
    const heavy = adviseLoad('menstrual', [
      item('1', 'Gym', '2026-08-18', 'intense'),
      item('2', 'Run', '2026-08-19', 'intense'),
      item('3', 'HIIT', '2026-08-20', 'intense'),
    ], 'uk');
    assert.equal(heavy.fit, 'high');
    assert.match(heavy.title, /Перегляньте плани/);
    assert.match(heavy.note, /«Gym»|«Run»|«HIIT»|важко|перенести/i);

    const gentle = adviseLoad('menstrual', [
      item('1', 'Йога', '2026-08-18', 'yoga'),
      item('2', 'Масаж', '2026-08-19', 'massage'),
      item('3', 'Плавання', '2026-08-20', 'swim'),
    ], 'uk');
    assert.equal(gentle.fit, 'ok');
    assert.match(gentle.title, /Перегляньте плани/);
    assert.match(gentle.note, /«Йога»|«Масаж»|«Плавання»|легш/i);
  });

  it('treats martial arts as hard load and ignores birthdays for busiest-day pick', () => {
    const advice = adviseLoad(
      'menstrual',
      [
        item('1', 'Джиуджитсу дзюдо', '2026-08-22', 'intense'),
        item('2', 'Др аніта', '2026-08-22', 'event'),
        item('3', 'Call', '2026-08-21', 'event'),
        item('4', 'Lunch', '2026-08-21', 'event'),
      ],
      'en',
    );
    assert.equal(advice.fit, 'high');
    assert.equal(advice.busiestDayISO, '2026-08-22');
    assert.match(advice.note, /"Джиуджитсу дзюдо".*period|moving|ease/i);
    assert.match(advice.note, /"Др аніта"/);
  });

  it('writes human copy for a mixed training and social day', () => {
    const advice = adviseLoad(
      'follicular',
      [
        item('1', 'Джиуджитсу дзюдо', '2026-08-22', 'intense'),
        item('2', 'Др аніта', '2026-08-22', 'event'),
      ],
      'uk',
    );
    assert.equal(advice.busiestDayISO, '2026-08-22');
    assert.match(advice.note, /«Джиуджитсу дзюдо»/);
    assert.match(advice.note, /«Др аніта»/);
    assert.doesNotMatch(advice.note, /Підходить:|Нові старти|брейншторм|Fits well/i);
  });

  it('wraps calendar event titles in language-appropriate quotes', () => {
    const uk = adviseLoad('luteal', [item('1', 'Gym', '2026-08-23', 'intense')], 'uk');
    assert.match(uk.note, /«Gym»/);
    const en = adviseLoad('luteal', [item('1', 'Gym', '2026-08-23', 'intense')], 'en');
    assert.match(en.note, /"Gym"/);
  });

  it('says peak days can take more when the calendar is empty', () => {
    const advice = adviseLoad('ovulatory', [], 'uk');
    assert.equal(advice.title, 'Що пасує цього тижня');
    assert.match(advice.note, /вільний|ключов|тренуван/i);
    assert.doesNotMatch(advice.note, /естроген|прогестерон|Підходить:/i);
  });

  it('titles the insight around the busiest day', () => {
    const advice = adviseLoad('luteal', [
      item('1', 'Масаж', '2026-08-23', 'massage'),
      item('2', 'Gym', '2026-08-23', 'intense'),
      item('3', 'Call', '2026-08-20', 'event'),
    ], 'en');
    assert.equal(advice.title, "Review your Sunday's plans");
    assert.match(advice.note, /"Massage"|"Gym"|luteal|heavy/i);
    assert.doesNotMatch(advice.note, /progesterone|estrogen|Fits well/i);
    assert.equal(advice.busiestDayISO, '2026-08-23');
  });

  it('uses the Ukrainian busiest-day insight title', () => {
    const advice = adviseLoad('luteal', [
      item('1', 'Масаж', '2026-08-23', 'massage'),
      item('2', 'Gym', '2026-08-23', 'intense'),
    ], 'uk');
    assert.equal(advice.title, 'Перегляньте плани на неділю');
    assert.match(advice.note, /«Масаж»|«Gym»|лютеїн|важч/i);
    assert.doesNotMatch(advice.note, /прогестерон|естроген|Підходить:/i);
    assert.equal(advice.busiestDayISO, '2026-08-23');
  });
});

describe('cycleInsight', () => {
  it('uses phase and hormone copy plus cognitive and social tips', () => {
    const insight = cycleInsight('menstrual', 'en');
    assert.equal(insight.title, 'Menstrual phase');
    assert.match(insight.note, /estrogen|progesterone/i);
    assert.match(insight.cognitiveTip ?? '', /Cognitive:/i);
    assert.match(insight.socialTip ?? '', /Social:/i);
    assert.doesNotMatch(insight.note, /calendar|workout|plan|Fits well/i);
    assert.equal(insight.events, 0);
    assert.equal(insight.busiestDay, null);
  });

  it('keeps Ukrainian phase wording with cognitive and social tips', () => {
    const insight = cycleInsight('ovulatory', 'uk');
    assert.equal(insight.title, 'Овуляторна фаза');
    assert.match(insight.note, /естроген/i);
    assert.match(insight.cognitiveTip ?? '', /Когнітивно:/);
    assert.match(insight.socialTip ?? '', /Соціально:/);
    assert.doesNotMatch(insight.note, /календар|Підходить|тренуван/i);
    assert.equal(insight.fit, 'low');
  });

  it('uses Variant A empty-cycle wording without tips', () => {
    const en = cycleInsight(null, 'en');
    assert.equal(en.title, 'No period logged yet');
    assert.match(en.note, /record the first day/i);
    assert.equal(en.cognitiveTip, null);
    assert.equal(en.socialTip, null);

    const uk = cycleInsight(null, 'uk');
    assert.equal(uk.title, 'Ще немає запису місячних');
    assert.match(uk.note, /запишіть перший день/i);
  });
});

describe('weekPlanInsight', () => {
  it('is offered on Sunday and Monday only', () => {
    assert.equal(isWeekPlanningDay('2026-08-23'), true); // Sunday
    assert.equal(isWeekPlanningDay('2026-08-24'), true); // Monday
    assert.equal(isWeekPlanningDay('2026-08-25'), false); // Tuesday
  });

  it('combines phase planning with a calm calendar outlook', () => {
    const plan = weekPlanInsight(
      'luteal',
      [
        item('1', 'Meeting', '2026-08-24', 'meeting'),
        item('2', 'Deep work', '2026-08-24', 'focus'),
        item('3', 'Sync', '2026-08-25', 'meeting'),
      ],
      'en',
    );
    assert.equal(plan.title, "This week's plan");
    assert.match(plan.note, /Lean on|Go easier|buffer|meeting/i);
    assert.match(plan.cognitiveTip ?? '', /Cognitive:/i);
  });
});

describe('dayAlignmentForPhase', () => {
  it('marks heavy period days as overloaded', () => {
    const fit = dayAlignmentForPhase('menstrual', [
      item('1', 'Gym', '2026-08-18', 'intense'),
      item('2', 'Run', '2026-08-18', 'intense'),
    ]);
    assert.equal(fit, 'over');
  });

  it('keeps yoga on a period day inside a comfortable load', () => {
    assert.equal(
      dayAlignmentForPhase('menstrual', [item('1', 'Йога', '2026-08-18', 'yoga')]),
      'fit',
    );
  });

  it('marks empty ovulation days as underloaded', () => {
    assert.equal(dayAlignmentForPhase('ovulatory', []), 'under');
  });
});

describe('planningForPhase', () => {
  it('gives rest guidance during menstruation', () => {
    const plan = planningForPhase('menstrual', 'uk');
    assert.match(plan.best.join(' '), /Відновлен/);
    assert.match(plan.avoid.join(' '), /інтенсивн|графік|вечор/);
  });
});
