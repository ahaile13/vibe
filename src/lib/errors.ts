/** Database errors arrive as "VIBE:CODE" or "VIBE:CODE:detail". */
export function parseVibeError(err: unknown): { code: string; detail?: string } {
  const msg = typeof err === 'string' ? err : (err as { message?: string })?.message ?? '';
  const m = /VIBE:([A-Z_]+)(?::([^\s]+))?/.exec(msg);
  if (m) return { code: m[1], detail: m[2] };
  if (/network|fetch/i.test(msg)) return { code: 'NETWORK' };
  return { code: 'UNKNOWN', detail: msg };
}

export const ERROR_TEXT: Record<string, string> = {
  AUTH_REQUIRED: 'Sign in to rate or post.',
  TOKEN_INVALID: 'Your location check expired. Check in again.',
  SLOW_DOWN: 'You just posted here. Give it a minute.',
  TOO_LONG: 'That’s too long. Keep it to 140 characters or a 10-second clip.',
  EMPTY: 'Write something first.',
  BAD_MEDIA: 'That file can’t be posted.',
  UPLOAD_MISSING: 'The upload didn’t finish. Try posting again.',
  DUPLICATE_EVENT: 'An event with that name is already happening nearby.',
  EVENT_LIMIT: 'You can create up to 5 events a day.',
  ENDED: 'This event has ended.',
  NETWORK: 'You’re offline or the connection dropped. Try again.',
};

export const errorText = (err: unknown) => {
  const { code, detail } = parseVibeError(err);
  return ERROR_TEXT[code] ?? (detail ? `Something went wrong: ${detail}` : 'Something went wrong. Try again.');
};
