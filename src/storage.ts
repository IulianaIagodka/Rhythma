import AsyncStorage from '@react-native-async-storage/async-storage';

import { defaultSettings, sortedUnique, type StoredData } from './cycle';

const STORAGE_KEY = 'rhythma.v1';

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
      settings: { ...defaultSettings(), ...(parsed.settings ?? {}) },
    };
  } catch {
    return { periodStarts: [], settings: defaultSettings() };
  }
}

export async function saveData(data: StoredData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
