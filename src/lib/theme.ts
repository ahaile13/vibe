export type ThemeMode = 'auto' | 'day' | 'night';
export type Theme = 'day' | 'night';

export const THEME_KEY = 'vibes.theme';

/** Daytime is 6:30 AM to 6:30 PM on the device clock. */
export function themeForTime(d = new Date()): Theme {
  const m = d.getHours() * 60 + d.getMinutes();
  return m >= 390 && m < 1110 ? 'day' : 'night';
}

export const resolveTheme = (mode: ThemeMode, d = new Date()): Theme => (mode === 'auto' ? themeForTime(d) : mode);

/** Runs before first paint (inlined in the page head) so the right theme shows immediately. */
export const THEME_BOOT = `(function(){try{var m=localStorage.getItem('${'vibes.theme'}')||'auto';var d=new Date(),t=d.getHours()*60+d.getMinutes();var th=m==='auto'?(t>=390&&t<1110?'day':'night'):m;document.documentElement.setAttribute('data-theme',th);}catch(e){}})();`;
