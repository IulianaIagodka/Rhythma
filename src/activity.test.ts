import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { adviseLoad, capacityForPhase } from './activity';

function classifyTitle(title: string): 'workout' | 'event' {
  const lower = title.toLowerCase();
  const WORKOUT = ['workout','gym','run','yoga','pilates','train','sport','fit','swim','тренув','зал','йога','пілатес','біг'];
  return WORKOUT.some((w) => lower.includes(w)) ? 'workout' : 'event';
}

describe('classifyTitle', () => {
  it('marks workouts vs generic events', () => {
    assert.equal(classifyTitle('Gym'), 'workout');
    assert.equal(classifyTitle('Тренування ніг'), 'workout');
    assert.equal(classifyTitle('Йога 30'), 'workout');
    assert.equal(classifyTitle('Дзвінок з клієнтом'), 'event');
  });
});

describe('capacityForPhase', () => {
  it('keeps period as recovery and ovulation as peak', () => {
    assert.equal(capacityForPhase('menstrual').load, 'low');
    assert.equal(capacityForPhase('ovulatory').load, 'high');
  });
});

describe('adviseLoad', () => {
  it('flags too much training during period', () => {
    const advice = adviseLoad('menstrual', [
      { id: '1', title: 'Gym', day: '2026-08-18', kind: 'workout' },
      { id: '2', title: 'Run', day: '2026-08-19', kind: 'workout' },
      { id: '3', title: 'HIIT', day: '2026-08-20', kind: 'workout' },
    ]);
    assert.equal(advice.fit, 'high');
    assert.equal(advice.workouts, 3);
  });

  it('says peak days can take more when the calendar is empty', () => {
    const advice = adviseLoad('ovulatory', []);
    assert.match(advice.note, /календар/);
  });
});
