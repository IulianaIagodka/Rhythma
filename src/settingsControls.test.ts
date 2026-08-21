import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { scheduleInsightToggleState } from './settingsControls';

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
