import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  FIRST_CYCLE_ENDING_SOON_DAYS,
  firstCycleTrialEndingTitleKind,
  firstCycleTrialJustEnded,
  isFirstCycleTrialActive,
  isFirstCycleTrialEndingSoon,
} from './firstCycleTrial';

describe('firstCycleTrial', () => {
  it('is inactive with no period starts and active with exactly one', () => {
    assert.equal(isFirstCycleTrialActive([]), false);
    assert.equal(isFirstCycleTrialActive(['2026-08-17']), true);
    assert.equal(isFirstCycleTrialActive(['2026-08-17', '2026-09-14']), false);
  });

  it('dedupes period starts when checking trial', () => {
    assert.equal(isFirstCycleTrialActive(['2026-08-17', '2026-08-17']), true);
  });

  it('flags ending soon within the reminder window', () => {
    assert.equal(isFirstCycleTrialEndingSoon(['2026-08-17'], 3), true);
    assert.equal(isFirstCycleTrialEndingSoon(['2026-08-17'], 0), true);
    assert.equal(isFirstCycleTrialEndingSoon(['2026-08-17'], 4), false);
    assert.equal(isFirstCycleTrialEndingSoon(['2026-08-17'], null), false);
    assert.equal(isFirstCycleTrialEndingSoon([], 1), false);
    assert.equal(isFirstCycleTrialEndingSoon(['2026-08-17', '2026-09-14'], 1), false);
    assert.equal(FIRST_CYCLE_ENDING_SOON_DAYS, 3);
  });

  it('detects the transition from first to second logged cycle', () => {
    assert.equal(firstCycleTrialJustEnded(['2026-08-17'], ['2026-08-17', '2026-09-14']), true);
    assert.equal(firstCycleTrialJustEnded([], ['2026-08-17']), false);
    assert.equal(firstCycleTrialJustEnded(['2026-08-17', '2026-09-14'], ['2026-08-17']), false);
  });

  it('picks ending-title variants from days left', () => {
    assert.equal(firstCycleTrialEndingTitleKind(null), 'soon');
    assert.equal(firstCycleTrialEndingTitleKind(0), 'today');
    assert.equal(firstCycleTrialEndingTitleKind(1), 'one');
    assert.equal(firstCycleTrialEndingTitleKind(2), 'days');
  });
});
