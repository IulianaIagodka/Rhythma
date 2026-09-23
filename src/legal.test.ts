import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { EULA_URL, formatAppVersionLabel, PRIVACY_POLICY_URL } from './legal';

describe('legal URLs', () => {
  it('exposes the App Store Privacy Policy and Apple Standard EULA URLs', () => {
    assert.equal(PRIVACY_POLICY_URL, 'https://iulianaiagodka.github.io/Rhythma/privacy.html');
    assert.equal(EULA_URL, 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
  });
});

describe('formatAppVersionLabel', () => {
  it('formats English and Ukrainian version labels with optional build', () => {
    assert.equal(formatAppVersionLabel('en', '1.0.8', '90'), 'Version 1.0.8 (90)');
    assert.equal(formatAppVersionLabel('uk', '1.0.8', '90'), 'Версія 1.0.8 (90)');
    assert.equal(formatAppVersionLabel('en', '1.0.8', null), 'Version 1.0.8');
    assert.equal(formatAppVersionLabel('uk', null, null), 'Версія —');
  });
});
