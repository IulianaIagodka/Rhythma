export const FEEDBACK_EMAIL = 'iuliana.iagodka@gmail.com';

export type FeedbackMailOptions = {
  language: 'en' | 'uk';
  appVersion?: string | null;
  buildNumber?: string | null;
  systemVersion?: string | null;
};

export function buildFeedbackMailto({
  language,
  appVersion,
  buildNumber,
  systemVersion,
}: FeedbackMailOptions): string {
  const subject = language === 'uk' ? 'Відгук про Rhythma' : 'Rhythma feedback';
  const versionLine =
    language === 'uk'
      ? `Версія: ${appVersion ?? '—'} (${buildNumber ?? '—'})`
      : `Version: ${appVersion ?? '—'} (${buildNumber ?? '—'})`;
  const systemLine =
    language === 'uk'
      ? `iOS: ${systemVersion ?? '—'}`
      : `iOS: ${systemVersion ?? '—'}`;
  const prompt =
    language === 'uk'
      ? 'Напишіть свій відгук або опишіть проблему нижче:'
      : 'Write your feedback or describe the issue below:';

  const body = [prompt, '', versionLine, systemLine, ''].join('\n');
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
