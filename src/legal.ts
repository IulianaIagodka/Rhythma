/** Public legal URLs for App Store Connect and in-app links. */
export const PRIVACY_POLICY_URL = 'https://iulianaiagodka.github.io/Rhythma/privacy.html';

/** Apple Standard Licensed Application End User License Agreement (ASC + in-app Terms of Use). */
export const EULA_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

export function formatAppVersionLabel(
  language: 'en' | 'uk',
  appVersion?: string | null,
  buildNumber?: string | null,
): string {
  const version = (appVersion && appVersion.trim()) || '—';
  const build = (buildNumber && buildNumber.trim()) || null;
  if (language === 'uk') {
    return build ? `Версія ${version} (${build})` : `Версія ${version}`;
  }
  return build ? `Version ${version} (${build})` : `Version ${version}`;
}
