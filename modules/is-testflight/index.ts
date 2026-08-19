import { requireNativeModule } from 'expo-modules-core';

type IsTestflightModule = {
  isTestFlight: () => boolean;
};

let cached: boolean | null = null;

function getModule(): IsTestflightModule | null {
  try {
    return requireNativeModule<IsTestflightModule>('IsTestflight');
  } catch {
    return null;
  }
}

export function isTestFlightBuild(): boolean {
  if (cached !== null) return cached;
  cached = getModule()?.isTestFlight() ?? false;
  return cached;
}
