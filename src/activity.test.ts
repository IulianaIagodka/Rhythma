import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { adviseLoad, capacityForPhase, cycleInsight, dayAlignmentForPhase, planningForPhase } from './activity';
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
    assert.match(capacityForPhase('luteal', 'uk').calendarHint, /спрощувати графік/);
  });
});

describe('adviseLoad', () => {
  it('flags hard training during period, not gentle movement', () => {
    const heavy = adviseLoad('menstrual', [
      item('1', 'Gym', '2026-08-18', 'intense'),
      item('2', 'Run', '2026-08-19', 'intense'),
      item('3', 'HIIT', '2026-08-20', 'intense'),
    ], 'uk');
    assert.equal(heavy.fit, 'high');
    assert.match(heavy.note, /перенести/);

    const gentle = adviseLoad('menstrual', [
      item('1', 'Йога', '2026-08-18', 'yoga'),
      item('2', 'Масаж', '2026-08-19', 'massage'),
      item('3', 'Плавання', '2026-08-20', 'swim'),
    ], 'uk');
    assert.equal(gentle.fit, 'ok');
    assert.match(gentle.note, /Йога — ок/);
    assert.match(gentle.note, /Масаж — ок/);
    assert.match(gentle.note, /Плавання — ок/);
  });

  it('says peak days can take more when the calendar is empty', () => {
    const advice = adviseLoad('ovulatory', [], 'uk');
    assert.match(advice.note, /додати тренування/);
    assert.match(advice.note, /найважливіші розмови|важливі/);
  });

  it('titles the insight around the busiest day', () => {
    const advice = adviseLoad('luteal', [
      item('1', 'Масаж', '2026-08-23', 'massage'),
      item('2', 'Gym', '2026-08-23', 'intense'),
      item('3', 'Call', '2026-08-20', 'event'),
    ], 'en');
    assert.match(advice.title, /Sunday is your busiest day/);
    assert.doesNotMatch(advice.note, /This week has/);
    assert.match(advice.note, /Massage is okay/);
    assert.match(advice.note, /Consider moving hard training/);
    assert.match(advice.note, /progesterone rises/i);
  });

  it('uses the Ukrainian busiest-day insight title', () => {
    const advice = adviseLoad('luteal', [
      item('1', 'Масаж', '2026-08-23', 'massage'),
      item('2', 'Gym', '2026-08-23', 'intense'),
    ], 'uk');
    assert.match(advice.title, /Неділя — ваш найнасиченіший день/);
    assert.doesNotMatch(advice.note, /На цьому тижні/);
  });
});

describe('cycleInsight', () => {
  it('uses phase capacity only, without calendar copy', () => {
    const insight = cycleInsight('menstrual', 'en');
    assert.equal(insight.title, 'Rest & release');
    assert.match(insight.note, /hormones are lowest/i);
    assert.doesNotMatch(insight.note, /calendar/i);
    assert.equal(insight.events, 0);
    assert.equal(insight.busiestDay, null);
  });

  it('keeps Ukrainian phase-only wording', () => {
    const insight = cycleInsight('ovulatory', 'uk');
    assert.equal(insight.title, 'Peak & powerful');
    assert.match(insight.note, /пік енергії/i);
    assert.doesNotMatch(insight.note, /календар/i);
    assert.equal(insight.fit, 'low');
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
