// Fallback cover for events without attendee photos yet: a soft, out-of-focus
// "night lights" image in muted tones. Deterministic per event.
const PALETTES: Record<string, [string, string, string]> = {
  Clubs: ['#6d5a8c', '#b4876f', '#1d1b2a'],
  Bars: ['#b98a5a', '#6f8a8c', '#1b2023'],
  Restaurants: ['#c08a6a', '#7a5a52', '#1e1a19'],
  Parties: ['#a87a8e', '#6f7aa0', '#1c1b24'],
  Concerts: ['#5f7f9a', '#b08a6a', '#151b22'],
  Events: ['#8a9a7a', '#c0a070', '#1a1f1c'],
  Sports: ['#5f7a8c', '#a9b2b8', '#161c21'],
};

function hash(s: string) {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}
function rng(seed: number) {
  let s = (seed % 2147483646) + 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function artBackground(id: string, category: string, variant = 0): string {
  const r = rng(hash(id) * 7 + variant * 131 + 3);
  const [a, b, base] = PALETTES[category] ?? PALETTES.Events;
  const L: string[] = [];
  // bokeh: a few large, soft, low-contrast discs
  for (let i = 0; i < 7; i++) {
    const col = i % 2 ? a : b;
    const size = Math.round(6 + r() * 14);
    const alpha = Math.round(30 + r() * 50).toString(16).padStart(2, '0');
    L.push(`radial-gradient(circle at ${Math.round(r() * 100)}% ${Math.round(8 + r() * 60)}%, ${col}${alpha} 0, ${col}00 ${size}%)`);
  }
  // broad ambient light from one side
  const side = r() > 0.5 ? 18 : 82;
  L.push(`radial-gradient(ellipse 90% 70% at ${side}% 30%, ${a}66 0, transparent 70%)`);
  L.push(`radial-gradient(ellipse 80% 60% at ${100 - side}% 75%, ${b}40 0, transparent 70%)`);
  L.push(`linear-gradient(180deg, ${base} 0%, #0b0f11 100%)`);
  return L.join(',');
}
