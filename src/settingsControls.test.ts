import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { cycleInsightToggleState, scheduleInsightToggleState } from './settingsControls';

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
