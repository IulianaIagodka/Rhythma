import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { allSourceTopics, sourceTitle, sourcesByTopic, sourcesForTopic } from './sources';

describe('sources', () => {
  it('lists every topic with at least one citation URL', () => {
    for (const topic of allSourceTopics) {
      const list = sourcesForTopic(topic);
      assert.ok(list.length >= 1, `expected sources for ${topic}`);
      for (const source of list) {
        assert.match(source.url, /^https:\/\//);
        assert.ok(source.titleEn.length > 10);
        assert.ok(source.titleUk.length > 10);
      }
    }
  });

  it('picks localized titles', () => {
    const [first] = sourcesByTopic.hormones;
    assert.notEqual(sourceTitle(first, 'en'), sourceTitle(first, 'uk'));
    assert.match(sourceTitle(first, 'en'), /Endotext|Reed/i);
  });
});
