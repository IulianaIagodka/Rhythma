import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { adviseLoad, capacityForPhase, cycleInsight, dayAlignmentForPhase, phaseStatusLabel, planningForPhase } from './activity';
import { classifyActivity, classifyTitle, type CalendarItem } from './calendarItems';

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
    kind: activity === 'event' ? 'event' : 'workout',
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
    assert.equal(classifyActivity('Meeting'), 'event');
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

describe('adviseLoad', () => {
  it('flags hard training during period as a heavier fit', () => {
    const heavy = adviseLoad('menstrual', [
      item('1', 'Gym', '2026-08-18', 'intense'),
      item('2', 'Run', '2026-08-19', 'intense'),
      item('3', 'HIIT', '2026-08-20', 'intense'),
    ], 'uk');
    assert.equal(heavy.fit, 'high');
    assert.match(heavy.title, /Перегляньте плани/);
    assert.match(heavy.note, /Підходить|уникати|перенести/);

    const gentle = adviseLoad('menstrual', [
      item('1', 'Йога', '2026-08-18', 'yoga'),
      item('2', 'Масаж', '2026-08-19', 'massage'),
      item('3', 'Плавання', '2026-08-20', 'swim'),
    ], 'uk');
    assert.equal(gentle.fit, 'ok');
    assert.match(gentle.title, /Перегляньте плани/);
    assert.match(gentle.note, /Йога|Масаж|Плавання/);
  });

  it('says peak days can take more when the calendar is empty', () => {
    const advice = adviseLoad('ovulatory', [], 'uk');
    assert.equal(advice.title, 'Що пасує цього тижня');
    assert.match(advice.note, /додати тренування/);
    assert.match(advice.note, /Підходить|Ключові розмови/);
    assert.doesNotMatch(advice.note, /естроген|прогестерон/);
  });

  it('titles the insight around the busiest day', () => {
    const advice = adviseLoad('luteal', [
      item('1', 'Масаж', '2026-08-23', 'massage'),
      item('2', 'Gym', '2026-08-23', 'intense'),
      item('3', 'Call', '2026-08-20', 'event'),
    ], 'en');
    assert.equal(advice.title, "Review your Sunday's plans");
    assert.match(advice.note, /Fits well|Ease off|moving|Massage/i);
    assert.doesNotMatch(advice.note, /progesterone|estrogen/i);
    assert.equal(advice.busiestDayISO, '2026-08-23');
  });

  it('uses the Ukrainian busiest-day insight title', () => {
    const advice = adviseLoad('luteal', [
      item('1', 'Масаж', '2026-08-23', 'massage'),
      item('2', 'Gym', '2026-08-23', 'intense'),
    ], 'uk');
    assert.equal(advice.title, 'Перегляньте плани на неділю');
    assert.match(advice.note, /Підходить|уникати|перенести|Масаж/);
    assert.doesNotMatch(advice.note, /прогестерон|естроген/);
    assert.equal(advice.busiestDayISO, '2026-08-23');
  });
});

describe('cycleInsight', () => {
  it('uses phase and hormone copy only, without calendar advice', () => {
    const insight = cycleInsight('menstrual', 'en');
    assert.equal(insight.title, 'Menstrual phase');
    assert.match(insight.note, /estrogen|progesterone/i);
    assert.doesNotMatch(insight.note, /calendar|workout|plan|Fits well/i);
    assert.equal(insight.events, 0);
    assert.equal(insight.busiestDay, null);
  });

  it('keeps Ukrainian phase-only wording', () => {
    const insight = cycleInsight('ovulatory', 'uk');
    assert.equal(insight.title, 'Овуляторна фаза');
    assert.match(insight.note, /естроген/i);
    assert.doesNotMatch(insight.note, /календар|Підходить|тренуван/i);
    assert.equal(insight.fit, 'low');
  });

  it('uses Variant A empty-cycle wording', () => {
    const en = cycleInsight(null, 'en');
    assert.equal(en.title, 'No period logged yet');
    assert.match(en.note, /record the first day/i);
    assert.doesNotMatch(en.note, /log your/i);

    const uk = cycleInsight(null, 'uk');
    assert.equal(uk.title, 'Ще немає запису місячних');
    assert.match(uk.note, /запишіть перший день/i);
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
