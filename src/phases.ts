export type PhaseId = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

export type PhaseCopy = {
  id: PhaseId;
  season: string;
  title: string;
  note: string;
};

export const PHASES: Record<PhaseId, PhaseCopy> = {
  menstrual: {
    id: 'menstrual',
    season: 'зима',
    title: 'спокій',
    note: 'менше планів, більше відновлення',
  },
  follicular: {
    id: 'follicular',
    season: 'весна',
    title: 'початки',
    note: 'нові ідеї, навчання, рух',
  },
  ovulatory: {
    id: 'ovulatory',
    season: 'літо',
    title: 'пік',
    note: 'зустрічі, рішення, голос',
  },
  luteal: {
    id: 'luteal',
    season: 'осінь',
    title: 'завершення',
    note: 'фокус, потім сповільнення',
  },
};
