import type { Language } from './i18n';

/** Contextual deep-link targets (maps to methodology sections). */
export type SourceTopic =
  | 'cycleForecast'
  | 'ovulation'
  | 'phases'
  | 'hormones'
  | 'activity'
  | 'energy';

/** Display sections in the methodology sheet. */
export type MethodologySectionId =
  | 'cycleForecast'
  | 'ovulation'
  | 'phases'
  | 'energy'
  | 'additional';

export type Source = {
  id: string;
  /** Short tappable citation, e.g. "Bull JR et al., 2019 ↗" */
  citeEn: string;
  citeUk: string;
  /** Longer accessibility / fallback title */
  titleEn: string;
  titleUk: string;
  url: string;
};

export const methodologySectionOrder: MethodologySectionId[] = [
  'cycleForecast',
  'ovulation',
  'phases',
  'energy',
  'additional',
];

const bull2019: Source = {
  id: 'bull-2019',
  citeEn: 'Bull JR et al., 2019 ↗',
  citeUk: 'Bull JR та ін., 2019 ↗',
  titleEn: 'Bull JR et al. — Real-world menstrual cycle characteristics (npj Digital Medicine, 2019)',
  titleUk: 'Bull JR та ін. — Характеристики менструального циклу в реальних умовах (npj Digital Medicine, 2019)',
  url: 'https://pubmed.ncbi.nlm.nih.gov/31482137/',
};

const reedEndotext: Source = {
  id: 'reed-endotext',
  citeEn: 'Reed & Carr, Endotext ↗',
  citeUk: 'Reed і Carr, Endotext ↗',
  titleEn: 'Reed BG, Carr BR — The Normal Menstrual Cycle (Endotext / NCBI Bookshelf)',
  titleUk: 'Reed BG, Carr BR — Нормальний менструальний цикл (Endotext / NCBI Bookshelf)',
  url: 'https://www.ncbi.nlm.nih.gov/books/NBK279054/',
};

const wilcox1995: Source = {
  id: 'wilcox-1995',
  citeEn: 'Wilcox AJ et al., 1995 ↗',
  citeUk: 'Wilcox AJ та ін., 1995 ↗',
  titleEn: 'Wilcox AJ et al. — Timing of sexual intercourse in relation to ovulation (NEJM, 1995)',
  titleUk: 'Wilcox AJ та ін. — Час статевого акту відносно овуляції (NEJM, 1995)',
  url: 'https://pubmed.ncbi.nlm.nih.gov/7477165/',
};

const acogFabm: Source = {
  id: 'acog-fabm',
  citeEn: 'ACOG — Fertility awareness ↗',
  citeUk: 'ACOG — Фертильність і цикл ↗',
  titleEn: 'ACOG — Fertility awareness and the menstrual cycle (patient FAQ)',
  titleUk: 'ACOG — Фертильність і менструальний цикл (пацієнтський FAQ)',
  url: 'https://www.acog.org/womens-health/faqs/fertility-awareness-based-methods-of-family-planning',
};

const statpearlsCycle: Source = {
  id: 'statpearls-cycle',
  citeEn: 'Thiyagarajan et al., StatPearls ↗',
  citeUk: 'Thiyagarajan та ін., StatPearls ↗',
  titleEn: 'Thiyagarajan DJ et al. — Physiology, Menstrual Cycle (StatPearls / NCBI)',
  titleUk: 'Thiyagarajan DJ та ін. — Фізіологія менструального циклу (StatPearls / NCBI)',
  url: 'https://www.ncbi.nlm.nih.gov/books/NBK500020/',
};

const gnrhEndotext: Source = {
  id: 'gnrh-endotext',
  citeEn: 'Endotext — GnRH physiology ↗',
  citeUk: 'Endotext — Фізіологія GnRH ↗',
  titleEn: 'Endotext — Physiology of GnRH and gonadotrophin secretion',
  titleUk: 'Endotext — Фізіологія GnRH і секреції гонадотропінів',
  url: 'https://www.ncbi.nlm.nih.gov/books/NBK279070/',
};

const mcnulty2020: Source = {
  id: 'mcnulty-2020',
  citeEn: 'McNulty KL et al., 2020 ↗',
  citeUk: 'McNulty KL та ін., 2020 ↗',
  titleEn: 'McNulty KL et al. — Menstrual cycle phase and exercise performance (Sports Medicine, 2020)',
  titleUk: 'McNulty KL та ін. — Фаза циклу й фізична активність (Sports Medicine, 2020)',
  url: 'https://pubmed.ncbi.nlm.nih.gov/32661839/',
};

const hackney2025: Source = {
  id: 'hackney-2025',
  citeEn: 'Hackney AC et al., 2025 ↗',
  citeUk: 'Hackney AC та ін., 2025 ↗',
  titleEn: 'Hackney AC et al. — Menstrual cycle effects on sports performance (Scand J Med Sci Sports, 2025)',
  titleUk: 'Hackney AC та ін. — Вплив циклу на спортивну продуктивність (Scand J Med Sci Sports, 2025)',
  url: 'https://pubmed.ncbi.nlm.nih.gov/40704904/',
};

/** Primary methodology sections — each unique source appears once. */
export const sourcesBySection: Record<MethodologySectionId, Source[]> = {
  cycleForecast: [bull2019, reedEndotext],
  ovulation: [wilcox1995, acogFabm],
  phases: [statpearlsCycle, reedEndotext],
  energy: [mcnulty2020, hackney2025, gnrhEndotext],
  additional: [],
};

/** @deprecated Prefer sourcesBySection — kept for topic mapping compatibility. */
export const sourcesByTopic: Record<SourceTopic, Source[]> = {
  cycleForecast: sourcesBySection.cycleForecast,
  ovulation: sourcesBySection.ovulation,
  phases: [...sourcesBySection.phases, reedEndotext],
  hormones: [reedEndotext, gnrhEndotext],
  activity: sourcesBySection.energy,
  energy: sourcesBySection.energy,
};

export function sectionForTopic(topic: SourceTopic | 'all'): MethodologySectionId | 'all' {
  if (topic === 'all') return 'all';
  if (topic === 'hormones' || topic === 'activity' || topic === 'energy') return 'energy';
  if (topic === 'phases') return 'phases';
  if (topic === 'ovulation') return 'ovulation';
  return 'cycleForecast';
}

export function sourcesForTopic(topic: SourceTopic): Source[] {
  return sourcesByTopic[topic];
}

export function sourcesForSection(section: MethodologySectionId): Source[] {
  return sourcesBySection[section];
}

export function sourceCite(source: Source, lang: Language): string {
  return lang === 'uk' ? source.citeUk : source.citeEn;
}

export function sourceTitle(source: Source, lang: Language): string {
  return lang === 'uk' ? source.titleUk : source.titleEn;
}

export const allSourceTopics: SourceTopic[] = [
  'cycleForecast',
  'ovulation',
  'phases',
  'hormones',
  'activity',
  'energy',
];

/** Every unique URL kept in the app (for compliance checks). */
export function allUniqueSources(): Source[] {
  const seen = new Set<string>();
  const out: Source[] = [];
  for (const section of methodologySectionOrder) {
    for (const source of sourcesBySection[section]) {
      if (seen.has(source.url)) continue;
      seen.add(source.url);
      out.push(source);
    }
  }
  return out;
}
