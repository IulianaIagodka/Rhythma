import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { daysSpannedByEvent, itemsFromCalendarEvents } from './calendarItems';

describe('daysSpannedByEvent', () => {
  it('keeps a one-day timed event on its local day', () => {
    const days = daysSpannedByEvent(
      {
        id: '1',
        title: 'Call',
        startDate: new Date(2024, 5, 23, 10, 0, 0),
        endDate: new Date(2024, 5, 23, 11, 0, 0),
      },
      '2024-06-17',
      '2024-06-23',
    );
    assert.deepEqual(days, ['2024-06-23']);
  });

  it('puts an all-day EventKit event on the UTC calendar day', () => {
    const days = daysSpannedByEvent(
      {
        id: '2',
        title: 'Holiday',
        allDay: true,
        startDate: new Date('2024-06-23T00:00:00.000Z'),
        endDate: new Date('2024-06-24T00:00:00.000Z'),
      },
      '2024-06-17',
      '2024-06-23',
    );
    assert.deepEqual(days, ['2024-06-23']);
  });

  it('repeats a weekend event on each day it covers', () => {
    const days = daysSpannedByEvent(
      {
        id: '3',
        title: 'Trip',
        startDate: new Date(2024, 5, 22, 9, 0, 0),
        endDate: new Date(2024, 5, 23, 18, 0, 0),
      },
      '2024-06-17',
      '2024-06-23',
    );
    assert.deepEqual(days, ['2024-06-22', '2024-06-23']);
  });
});

describe('itemsFromCalendarEvents', () => {
  it('lists both events that fall on the same Sunday', () => {
    const items = itemsFromCalendarEvents(
      [
        {
          id: 'a',
          title: 'Тренування гравітація',
          startDate: new Date(2024, 5, 23, 10, 0, 0),
          endDate: new Date(2024, 5, 23, 11, 0, 0),
        },
        {
          id: 'b',
          title: 'Обід з подругою',
          startDate: new Date(2024, 5, 23, 14, 0, 0),
          endDate: new Date(2024, 5, 23, 16, 0, 0),
        },
      ],
      '2024-06-17',
      '2024-06-23',
      'uk',
    );
    const sunday = items.filter((item) => item.day === '2024-06-23');
    assert.equal(sunday.length, 2);
    assert.equal(sunday[0].kind, 'event');
    assert.equal(sunday[1].kind, 'workout');
  });
});
