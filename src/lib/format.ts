const M = 60_000, H = 3_600_000;

export function ago(ms: number) {
  if (!Number.isFinite(ms)) return '';
  if (ms < 45_000) return 'just now';
  if (ms < H) return `${Math.round(ms / M)} min ago`;
  if (ms < 24 * H) return `${Math.round(ms / H)} hr ago`;
  return `${Math.round(ms / (24 * H))} d ago`;
}

export const clock = (t: number | string) =>
  new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export function dayLabel(t: number | string) {
  const d = new Date(t), n = new Date();
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const b = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
  const diff = Math.round((a - b) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long' });
}

export const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
