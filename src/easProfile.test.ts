import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('eas production profile', () => {
  it('ships App Store builds with IAP and monetization on', () => {
    const eas = JSON.parse(readFileSync(join(root, 'eas.json'), 'utf8')) as {
      build: { production: { env?: Record<string, string> }; testflight?: { extends?: string } };
    };
    const env = eas.build.production.env ?? {};
    assert.equal(env.EXPO_PUBLIC_IAP_PLUS, '1');
    assert.equal(env.EXPO_PUBLIC_MONETIZATION, '1');
    assert.notEqual(env.EXPO_PUBLIC_EARLY_ACCESS, '1');
    assert.notEqual(env.EXPO_PUBLIC_PLAN_SWITCH, '1');
  });

  it('keeps TestFlight as an extension of production (paid path + QA switch)', () => {
    const eas = JSON.parse(readFileSync(join(root, 'eas.json'), 'utf8')) as {
      build: {
        production: { env?: Record<string, string> };
        testflight: { extends?: string; env?: Record<string, string> };
      };
    };
    assert.equal(eas.build.testflight.extends, 'production');
    assert.equal(eas.build.testflight.env?.EXPO_PUBLIC_PLAN_SWITCH, '1');
  });
});
