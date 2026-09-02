import type { Language } from './i18n';

export type SourceTopic =
  | 'cycleForecast'
  | 'ovulation'
  | 'phases'
  | 'hormones'
  | 'activity'
  | 'energy';

export type Source = {
  id: string;
  titleEn: string;
  titleUk: string;
  url: string;
};

export const sourcesByTopic: Record<SourceTopic, Source[]> = {
  cycleForecast: [
    {
      id: 'bull-2019',
      titleEn: 'Bull JR et al. — Real-world menstrual cycle characteristics (npj Digital Medicine, 2019)',
      titleUk: 'Bull JR та ін. — Характеристики менструального циклу в реальних умовах (npj Digital Medicine, 2019)',
      url: 'https://pubmed.ncbi.nlm.nih.gov/31482137/',
    },
    {
      id: 'reed-endotext',
      titleEn: 'Reed BG, Carr BR — The Normal Menstrual Cycle (Endotext / NCBI Bookshelf)',
      titleUk: 'Reed BG, Carr BR — Нормальний менструальний цикл (Endotext / NCBI Bookshelf)',
      url: 'https://www.ncbi.nlm.nih.gov/books/NBK279054/',
    },
  ],
  ovulation: [
    {
      id: 'wilcox-1995',
      titleEn: 'Wilcox AJ et al. — Timing of sexual intercourse in relation to ovulation (NEJM, 1995)',
      titleUk: 'Wilcox AJ та ін. — Час овуляції відносно лютеїнової фази (NEJM, 1995)',
      url: 'https://pubmed.ncbi.nlm.nih.gov/7477165/',
    },
    {
      id: 'acog-fabm',
      titleEn: 'ACOG — Fertility awareness and the menstrual cycle (patient FAQ)',
      titleUk: 'ACOG — Фертильність і менструальний цикл (пацієнтський FAQ)',
      url: 'https://www.acog.org/womens-health/faqs/fertility-awareness-based-methods-of-family-planning',
    },
    {
      id: 'reed-endotext-ov',
      titleEn: 'Reed BG, Carr BR — Control of ovulation (Endotext / NCBI Bookshelf)',
      titleUk: 'Reed BG, Carr BR — Регуляція овуляції (Endotext / NCBI Bookshelf)',
      url: 'https://www.ncbi.nlm.nih.gov/books/NBK279054/',
    },
  ],
  phases: [
    {
      id: 'statpearls-cycle',
      titleEn: 'Thiyagarajan DJ et al. — Physiology, Menstrual Cycle (StatPearls / NCBI)',
      titleUk: 'Thiyagarajan DJ та ін. — Фізіологія менструального циклу (StatPearls / NCBI)',
      url: 'https://www.ncbi.nlm.nih.gov/books/NBK500020/',
    },
    {
      id: 'reed-endotext-phases',
      titleEn: 'Reed BG, Carr BR — Menstrual cycle phases (Endotext / NCBI Bookshelf)',
      titleUk: 'Reed BG, Carr BR — Фази менструального циклу (Endotext / NCBI Bookshelf)',
      url: 'https://www.ncbi.nlm.nih.gov/books/NBK279054/',
    },
  ],
  hormones: [
    {
      id: 'reed-endotext-hormones',
      titleEn: 'Reed BG, Carr BR — Hormonal control of the menstrual cycle (Endotext)',
      titleUk: 'Reed BG, Carr BR — Гормональний контроль циклу (Endotext)',
      url: 'https://www.ncbi.nlm.nih.gov/books/NBK279054/',
    },
    {
      id: 'gnrh-endotext',
      titleEn: 'Endotext — Physiology of GnRH and gonadotrophin secretion',
      titleUk: 'Endotext — Фізіологія GnRH і секреції гонадотропінів',
      url: 'https://www.ncbi.nlm.nih.gov/books/NBK279070/',
    },
  ],
  activity: [
    {
      id: 'mcnulty-2020',
      titleEn: 'McNulty KL et al. — Menstrual cycle phase and exercise performance (Sports Medicine, 2020)',
      titleUk: 'McNulty KL та ін. — Фаза циклу й фізична активність (Sports Medicine, 2020)',
      url: 'https://pubmed.ncbi.nlm.nih.gov/32661839/',
    },
    {
      id: 'hackney-2025',
      titleEn: 'Hackney AC et al. — Menstrual cycle effects on sports performance (Scand J Med Sci Sports, 2025)',
      titleUk: 'Hackney AC та ін. — Вплив циклу на спортивну продуктивність (Scand J Med Sci Sports, 2025)',
      url: 'https://pubmed.ncbi.nlm.nih.gov/40704904/',
    },
  ],
  energy: [
    {
      id: 'reed-endotext-energy',
      titleEn: 'Reed BG, Carr BR — Cyclic hormonal patterns across the cycle (Endotext)',
      titleUk: 'Reed BG, Carr BR — Циклічні гормональні патерни (Endotext)',
      url: 'https://www.ncbi.nlm.nih.gov/books/NBK279054/',
    },
    {
      id: 'mcnulty-energy',
      titleEn: 'McNulty KL et al. — Cycle phase effects on performance and recovery (Sports Medicine, 2020)',
      titleUk: 'McNulty KL та ін. — Вплив фази циклу на продуктивність і відновлення (Sports Medicine, 2020)',
      url: 'https://pubmed.ncbi.nlm.nih.gov/32661839/',
    },
  ],
};

export function sourcesForTopic(topic: SourceTopic): Source[] {
  return sourcesByTopic[topic];
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
