import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { daysSpannedByEvent, formatEventTime, itemsFromCalendarEvents } from './calendarItems';
import { calendarIdsForSync, plainCalendarEvent } from './calendarSync';

describe('calendarIdsForSync', () => {
  it('keeps every calendar id, including ones marked not visible', () => {
    assert.deepEqual(
      calendarIdsForSync([
        { id: 'a', isVisible: true },
        { id: 'b', isVisible: false },
        { id: '  ', isVisible: true },
        { id: 'c' },
      ]),
      ['a', 'b', 'c'],
    );
  });
});

describe('plainCalendarEvent', () => {
  it('flattens EventKit-style records and drops events without a start', () => {
    assert.deepEqual(
      plainCalendarEvent(
        {
          id: '1',
          title: 'Yoga',
          startDate: '2026-08-21T10:00:00.000Z',
          endDate: '2026-08-21T11:00:00.000Z',
          allDay: false,
        },
        0,
      ),
      {
        id: '1',
        title: 'Yoga',
        startDate: '2026-08-21T10:00:00.000Z',
        endDate: '2026-08-21T11:00:00.000Z',
        allDay: false,
      },
    );
    assert.equal(plainCalendarEvent({ title: 'No start' }, 1), null);
  });
});

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

  it('keeps a weekend event on its start day', () => {
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
    assert.deepEqual(days, ['2024-06-22']);
  });

  it('skips events with an invalid start date', () => {
    assert.deepEqual(
      daysSpannedByEvent(
        { id: 'x', title: 'Broken', startDate: 'not-a-date' },
        '2024-06-17',
        '2024-06-23',
      ),
      [],
    );
  });
});

describe('itemsFromCalendarEvents', () => {
  it('lists both events that fall on the same Sunday in start-time order', () => {
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
    assert.equal(sunday[0].kind, 'workout');
    assert.equal(sunday[1].kind, 'event');
    assert.equal(formatEventTime(sunday[0], 'uk'), '10:00 – 11:00');
    assert.equal(formatEventTime(sunday[1], 'uk'), '14:00 – 16:00');
  });

  it('labels all-day events without a clock range', () => {
    const items = itemsFromCalendarEvents(
      [
        {
          id: 'd',
          title: 'Holiday',
          allDay: true,
          startDate: new Date('2024-06-23T00:00:00.000Z'),
          endDate: new Date('2024-06-24T00:00:00.000Z'),
        },
      ],
      '2024-06-17',
      '2024-06-23',
      'en',
    );
    assert.equal(items.length, 1);
    assert.equal(formatEventTime(items[0], 'en'), 'All day');
  });
});
