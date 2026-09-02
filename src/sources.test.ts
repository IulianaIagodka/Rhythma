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

  it('uses verified PubMed and NCBI accession IDs', () => {
    const expected: Record<string, string> = {
      'bull-2019': '31482137',
      'wilcox-1995': '7477165',
      'mcnulty-2020': '32661839',
      'hackney-2025': '40704904',
      'reed-endotext': 'NBK279054',
      'statpearls-cycle': 'NBK500020',
      'gnrh-endotext': 'NBK279070',
    };
    for (const list of Object.values(sourcesByTopic)) {
      for (const source of list) {
        const token = expected[source.id];
        if (token) assert.ok(source.url.includes(token), `${source.id} should include ${token}`);
      }
    }
  });

  it('picks localized titles', () => {
    const [first] = sourcesByTopic.hormones;
    assert.notEqual(sourceTitle(first, 'en'), sourceTitle(first, 'uk'));
    assert.match(sourceTitle(first, 'en'), /Endotext|Reed/i);
  });
});
