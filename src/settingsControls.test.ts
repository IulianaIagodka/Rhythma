import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  calendarSyncNowState,
  cycleInsightToggleState,
  scheduleInsightToggleState,
} from './settingsControls';

describe('cycleInsightToggleState', () => {
  it('stays enabled regardless of calendar sync — cycle insight is phase-only', () => {
    assert.deepEqual(cycleInsightToggleState(true), { disabled: false, value: true });
    assert.deepEqual(cycleInsightToggleState(false), { disabled: false, value: false });
  });
});

describe('scheduleInsightToggleState', () => {
  it('disables and forces off when calendar sync is off', () => {
    assert.deepEqual(scheduleInsightToggleState(false, true), { disabled: true, value: false });
    assert.deepEqual(scheduleInsightToggleState(false, false), { disabled: true, value: false });
  });

  it('enables and mirrors the stored preference when calendar sync is on', () => {
    assert.deepEqual(scheduleInsightToggleState(true, true), { disabled: false, value: true });
    assert.deepEqual(scheduleInsightToggleState(true, false), { disabled: false, value: false });
  });
});

describe('calendarSyncNowState', () => {
  it('hides the Sync button when calendar sync is off', () => {
    assert.deepEqual(calendarSyncNowState(false, false), { visible: false, disabled: false });
    assert.deepEqual(calendarSyncNowState(false, true), { visible: false, disabled: true });
  });

  it('shows Sync when calendar sync is on and disables it while syncing', () => {
    assert.deepEqual(calendarSyncNowState(true, false), { visible: true, disabled: false });
    assert.deepEqual(calendarSyncNowState(true, true), { visible: true, disabled: true });
  });
});
