import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  allSourceTopics,
  allUniqueSources,
  methodologySectionOrder,
  sectionForTopic,
  sourceCite,
  sourceTitle,
  sourcesBySection,
  sourcesByTopic,
  sourcesForSection,
  sourcesForTopic,
} from './sources';

describe('sources', () => {
  it('lists every methodology section that is shown with sources', () => {
    for (const section of methodologySectionOrder) {
      const list = sourcesForSection(section);
      if (section === 'additional' && list.length === 0) continue;
      assert.ok(list.length >= 1, `expected sources for ${section}`);
      for (const source of list) {
        assert.match(source.url, /^https:\/\//);
        assert.ok(source.citeEn.includes('↗'));
        assert.ok(source.citeUk.includes('↗'));
        assert.ok(!source.citeEn.includes('http'));
        assert.ok(source.titleEn.length > 10);
        assert.ok(source.titleUk.length > 10);
      }
    }
  });

  it('keeps every topic with at least one citation URL', () => {
    for (const topic of allSourceTopics) {
      const list = sourcesForTopic(topic);
      assert.ok(list.length >= 1, `expected sources for ${topic}`);
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
      'acog-fabm': 'fertility-awareness',
    };
    const byId = new Map(allUniqueSources().map((source) => [source.id, source]));
    // Also include sources that appear in topic maps
    for (const list of Object.values(sourcesByTopic)) {
      for (const source of list) byId.set(source.id, source);
    }
    for (const [id, token] of Object.entries(expected)) {
      const source = byId.get(id);
      assert.ok(source, `missing source ${id}`);
      assert.ok(source!.url.includes(token), `${id} should include ${token}`);
    }
  });

  it('maps contextual topics to methodology sections', () => {
    assert.equal(sectionForTopic('cycleForecast'), 'cycleForecast');
    assert.equal(sectionForTopic('ovulation'), 'ovulation');
    assert.equal(sectionForTopic('phases'), 'phases');
    assert.equal(sectionForTopic('hormones'), 'energy');
    assert.equal(sectionForTopic('activity'), 'energy');
    assert.equal(sectionForTopic('energy'), 'energy');
    assert.equal(sectionForTopic('all'), 'all');
  });

  it('picks localized short cites and titles', () => {
    const [first] = sourcesBySection.cycleForecast;
    assert.notEqual(sourceCite(first, 'en'), sourceCite(first, 'uk'));
    assert.match(sourceCite(first, 'en'), /Bull|2019/);
    assert.notEqual(sourceTitle(first, 'en'), sourceTitle(first, 'uk'));
  });

  it('retains all previously published reference URLs', () => {
    const urls = new Set(allUniqueSources().map((source) => source.url));
    // Reed may appear in multiple sections; unique set still includes it once
    for (const list of Object.values(sourcesBySection)) {
      for (const source of list) urls.add(source.url);
    }
    assert.ok(urls.has('https://pubmed.ncbi.nlm.nih.gov/31482137/'));
    assert.ok(urls.has('https://pubmed.ncbi.nlm.nih.gov/7477165/'));
    assert.ok(urls.has('https://www.ncbi.nlm.nih.gov/books/NBK279054/'));
    assert.ok(urls.has('https://www.ncbi.nlm.nih.gov/books/NBK500020/'));
    assert.ok(urls.has('https://www.ncbi.nlm.nih.gov/books/NBK279070/'));
    assert.ok(urls.has('https://pubmed.ncbi.nlm.nih.gov/32661839/'));
    assert.ok(urls.has('https://pubmed.ncbi.nlm.nih.gov/40704904/'));
    assert.ok(
      urls.has(
        'https://www.acog.org/womens-health/faqs/fertility-awareness-based-methods-of-family-planning',
      ),
    );
  });
});
