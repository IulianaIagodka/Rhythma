import AsyncStorage from '@react-native-async-storage/async-storage';

import { defaultSettings, sortedUnique, type Settings, type StoredData } from './cycle';

const STORAGE_KEY = 'rhythma.v1';

function migrateSettings(raw: Partial<Settings> & { showEventAdvice?: boolean }): Settings {
  const defaults = defaultSettings();
  const merged = { ...defaults, ...raw };
  const legacyAdvice =
    typeof raw.showEventAdvice === 'boolean' ? raw.showEventAdvice : undefined;
  if (typeof raw.showCycleInsight !== 'boolean' && legacyAdvice != null) {
    merged.showCycleInsight = legacyAdvice;
  }
  if (typeof raw.showScheduleInsight !== 'boolean' && legacyAdvice != null) {
    merged.showScheduleInsight = legacyAdvice;
  }
  delete (merged as { showEventAdvice?: boolean }).showEventAdvice;
  return merged;
}

export async function loadData(): Promise<StoredData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { periodStarts: [], settings: defaultSettings() };
    const parsed = JSON.parse(raw) as Partial<StoredData>;
    const starts = Array.isArray(parsed.periodStarts)
      ? parsed.periodStarts.filter((value): value is string => typeof value === 'string')
      : [];
    return {
      periodStarts: sortedUnique(starts),
      settings: migrateSettings((parsed.settings ?? {}) as Partial<Settings> & { showEventAdvice?: boolean }),
    };
  } catch {
    return { periodStarts: [], settings: defaultSettings() };
  }
}

export async function saveData(data: StoredData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
