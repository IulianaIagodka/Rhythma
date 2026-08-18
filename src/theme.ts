export type Theme = {
  background: string;
  card: string;
  ink: string;
  muted: string;
  faint: string;
  accent: string;
  accentSoft: string;
  border: string;
  teal: string;
  tealSoft: string;
  tabBar: string;
  period: string;
  periodForecast: string;
  follicular: string;
  ovulatory: string;
  luteal: string;
};

export const lightTheme: Theme = {
  background: '#FFFFFF',
  card: '#F4F4F6',
  ink: '#1A1A1A',
  muted: '#8E8E93',
  faint: '#C7C7CC',
  accent: '#E91E8C',
  accentSoft: '#FCE4F1',
  border: '#E5E5EA',
  teal: '#5ECAD6',
  tealSoft: '#D7F4F7',
  tabBar: '#FFFFFF',
  period: '#E91E8C',
  periodForecast: '#F5A8D0',
  follicular: '#B8E8EE',
  ovulatory: '#5ECAD6',
  luteal: '#D4D4D8',
};

export const darkTheme: Theme = {
  background: '#0A0A0A',
  card: '#1C1C1E',
  ink: '#FFFFFF',
  muted: '#98989D',
  faint: '#48484A',
  accent: '#FF10F0',
  accentSoft: '#3A1530',
  border: '#2C2C2E',
  teal: '#5ECAD6',
  tealSoft: '#16383C',
  tabBar: '#0A0A0A',
  period: '#FF10F0',
  periodForecast: '#8A1480',
  follicular: '#2A4050',
  ovulatory: '#5ECAD6',
  luteal: '#3A3A3C',
};

export type ThemeMode = 'light' | 'dark';

export function themeFor(mode: ThemeMode): Theme {
  return mode === 'dark' ? darkTheme : lightTheme;
}
