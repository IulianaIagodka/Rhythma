import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { monotoneCubicPath, monotoneCubicPathRange } from './chartPath';

describe('monotoneCubicPath', () => {
  it('builds a cubic Bézier path instead of sharp polylines', () => {
    const d = monotoneCubicPath([
      { x: 0, y: 10 },
      { x: 10, y: 10 },
      { x: 20, y: 2 },
      { x: 30, y: 2 },
    ]);
    assert.match(d, /^M /);
    assert.match(d, / C /);
    assert.doesNotMatch(d, / L /);
  });

  it('returns empty for a single point and a line for two points', () => {
    assert.equal(monotoneCubicPath([{ x: 1, y: 2 }]), '');
    assert.equal(monotoneCubicPath([{ x: 0, y: 0 }, { x: 5, y: 5 }]), 'M 0.00 0.00 L 5.00 5.00');
  });

  it('slices a range for phase-colored compact segments', () => {
    const points = [
      { x: 0, y: 8 },
      { x: 4, y: 8 },
      { x: 8, y: 4 },
      { x: 12, y: 2 },
    ];
    const d = monotoneCubicPathRange(points, 1, 3);
    assert.match(d, /^M 4\.00 8\.00/);
    assert.match(d, / C /);
  });
});
