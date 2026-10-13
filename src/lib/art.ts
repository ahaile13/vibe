// Generated cover art for events that don't have photos yet. Deterministic per event.
const PALETTES: Record<string, string[]> = {
  // Every palette leans on the brand violet so placeholder art feels like VIBES.
  Clubs: ['#a66bff', '#ff2e9a', '#4b17a8'],
  Bars: ['#c08bff', '#ff9a5c', '#3d1c8c'],
  Restaurants: ['#d8b4ff', '#ff8a5c', '#5b22c4'],
  Parties: ['#ff4fd8', '#8b5cff', '#2a0f6b'],
  Concerts: ['#7b3ff2', '#38bdf8', '#ff3d8b'],
  Events: ['#b98cff', '#ffd36b', '#5b22c4'],
  Sports: ['#6d5bff', '#c9d2ff', '#2b1a6b'],
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
  const [a, b, c] = PALETTES[category] ?? PALETTES.Events;
  const L: string[] = [];
  if (['Concerts', 'Sports', 'Parties', 'Clubs'].includes(category)) {
    for (let i = 0; i < 11; i++) {
      const x = Math.round(-4 + i * 10.5 + r() * 6);
      L.push(
        `radial-gradient(ellipse 3.3% 4.4% at ${x}% ${86 + r() * 3}%,#050506 95%,transparent 100%)`,
        `radial-gradient(ellipse 8.5% 10% at ${x}% 101%,#050506 96%,transparent 100%)`,
      );
    }
  }
  for (let i = 0; i < 12; i++) {
    const s = (0.6 + r() * 2.4).toFixed(1);
    L.push(`radial-gradient(circle at ${Math.round(r() * 100)}% ${Math.round(r() * 72)}%,rgba(255,255,255,${(0.25 + r() * 0.45).toFixed(2)}) 0,transparent ${s}%)`);
  }
  if (['Clubs', 'Concerts', 'Parties'].includes(category)) {
    const o = Math.round(150 + r() * 60);
    L.push(`conic-gradient(from ${o}deg at ${30 + Math.round(r() * 40)}% -12%,transparent 0 6deg,${a}66 9deg,transparent 14deg 24deg,${c}55 27deg,transparent 32deg 42deg,${b}55 45deg,transparent 50deg)`);
  }
  for (let i = 0; i < 5; i++) {
    const col = [a, b, c][i % 3];
    L.push(`radial-gradient(circle at ${Math.round(r() * 100)}% ${Math.round(r() * 75)}%,${col}cc 0,${col}00 ${Math.round(28 + r() * 42)}%)`);
  }
  L.push('linear-gradient(180deg,#0d0f14,#050506)');
  return L.join(',');
}
