/** Set once the opening city screen has been passed in this browser session. */
export const INTRO_KEY = 'vibes.intro';

/**
 * Runs before first paint (inlined in the page head): shows the opening city
 * screen on a fresh visit to the home page, so the feed never flashes first.
 * Shared links to an event or the map skip it.
 */
export const INTRO_BOOT = `(function(){try{if(location.pathname==='/'&&!sessionStorage.getItem('${INTRO_KEY}'))document.documentElement.setAttribute('data-intro','1');}catch(e){}})();`;

/** Event that reopens the city carousel from anywhere in the app. */
export const INTRO_OPEN = 'vibes:intro';

export function openCityIntro() {
  document.documentElement.setAttribute('data-intro', '1');
  window.dispatchEvent(new Event(INTRO_OPEN));
}
