let override: boolean | null = null;

export function setTestFlightOverrideForTests(value: boolean | null): void {
  override = value;
}

export function isTestFlightRuntime(): boolean {
  if (override !== null) return override;

  try {
    // Local Expo module — unavailable in Node tests and Expo Go on non-iOS.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { isTestFlightBuild } = require('is-testflight') as typeof import('is-testflight');
    return isTestFlightBuild();
  } catch {
    return false;
  }
}
