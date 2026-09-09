import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildFeedbackMailto, FEEDBACK_EMAIL } from './feedback';

describe('feedback', () => {
  it('builds a mailto link to the support inbox with version context', () => {
    const url = buildFeedbackMailto({
      language: 'en',
      appVersion: '1.0.4',
      buildNumber: '83',
      systemVersion: '18.5',
    });

    assert.ok(url.startsWith(`mailto:${FEEDBACK_EMAIL}?`));
    assert.match(url, /subject=Rhythma%20feedback/);
    assert.match(url, /Version%3A%201\.0\.4%20\(83\)/);
    assert.match(url, /iOS%3A%2018\.5/);
  });

  it('uses Ukrainian subject and prompt', () => {
    const url = buildFeedbackMailto({
      language: 'uk',
      appVersion: '1.0.0',
      buildNumber: '1',
      systemVersion: '17.0',
    });

    assert.match(url, /subject=%D0%92%D1%96%D0%B4%D0%B3%D1%83%D0%BA%20%D0%BF%D1%80%D0%BE%20Rhythma/);
    assert.match(url, /%D0%92%D0%B5%D1%80%D1%81%D1%96%D1%8F/);
  });
});
