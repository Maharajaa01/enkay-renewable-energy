import { COMPANY_INFO } from '../data/solarData';

// FormSubmit (formsubmit.co) relays form data to the inbox by email — no backend or API key needed.
// The very first submission sends an activation email to the inbox; nothing is delivered until it is confirmed.
const ENDPOINT = `https://formsubmit.co/ajax/${COMPANY_INFO.email}`;

export async function sendFormEmail(subject: string, fields: Record<string, string>, replyTo?: string) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      _subject: subject,
      _template: 'table',
      _captcha: 'false',
      ...(replyTo ? { _replyto: replyTo } : {}),
      ...fields,
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || String(data?.success) !== 'true') {
    throw new Error(`FormSubmit failed: ${data?.message ?? res.status}`);
  }
}
