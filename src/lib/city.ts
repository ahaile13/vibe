import type { LatLng } from './types';

/**
 * Skyline shapes. Numbers are in a 1440 x 480 authoring space (the renderer
 * draws heights 1.6x taller and widths 1.25x wider): x is the left edge (center
 * for 'sphere', 'needle', 'obelisk'), w the width, h the height above the
 * street, s an optional spire/antenna height. Keep landmarks between x 380 and
 * 1080 so they stay in frame on phones. Only signature buildings go here;
 * generic towers are generated around them.
 */
export type LandmarkKind =
  | 'sphere' // tower topped by a lit globe (Reunion Tower)
  | 'needle' // thin stem with a saucer top (Space Needle, Tower of the Americas)
  | 'outline' // tower traced in colored light (Bank of America Plaza, Dallas)
  | 'prism' // faceted glass top (Fountain Place, Columbia Center)
  | 'xtower' // X-braced tower with twin masts (Renaissance Tower)
  | 'arch' // rounded crown (Comerica, Salesforce SF, Wells Fargo Denver)
  | 'keyhole' // opening near the top (Chase Tower Dallas, Comcast Tech Center)
  | 'spire' // setbacks finishing in a spire (Empire State, One Liberty Place)
  | 'sunburst' // stacked arches and needle (Chrysler Building)
  | 'sail' // curved sail crown with spire (Wilshire Grand)
  | 'cap' // tower with a pyramid cap (One America Plaza, Salesforce Indy)
  | 'wtc' // chamfered taper, optional spire (One World Trade, Comcast Center)
  | 'antenna2' // stacked setbacks with two antennas (Willis Tower)
  | 'taper' // tapered, X-braced, two antennas (875 N Michigan)
  | 'pyramid' // tall pyramid (Transamerica)
  | 'crown' // ring of spikes (Bank of America Corporate Center, US Bank Tower)
  | 'twinspire' // two corner spires (AT&T "Batman" building)
  | 'obelisk' // monument column with statue (Soldiers' and Sailors' Monument)
  | 'dome' // capitol or city hall dome
  | 'stack' // offset stacked blocks (The Independent)
  | 'gable' // stepped gables (Bank of America Center Houston, Frost Tower Austin)
  | 'block';

export interface Landmark {
  kind: LandmarkKind;
  x: number;
  w?: number;
  h: number;
  s?: number;
  /** Signature light color (lit crown, outline, ring). */
  color?: string;
  /** Red aviation light that blinks on top. */
  beacon?: boolean;
}

/** What rises behind the buildings. */
export type Terrain = 'none' | 'range' | 'peak' | 'hills' | 'mesa';
/** Foreground or nearby features that say "this city". */
export type Prop = 'palms' | 'saguaro' | 'goldengate' | 'liftbridge';

export interface City {
  id: string;
  name: string;
  state: string;
  center: LatLng;
  terrain: Terrain;
  props?: Prop[];
  landmarks: Landmark[];
}

const GOLD = '#f2d58a', WARM = '#e9b77a', ICE = '#9fd0ff', SILVER = '#d5dde0', GREEN = '#7fbf9f', LED = '#cfe3ff';
const L = (kind: LandmarkKind, x: number, w: number, h: number, o: { s?: number; color?: string; beacon?: boolean } = {}): Landmark => ({ kind, x, w, h, ...o });

/** The 20 most populated US cities (Census Bureau estimates), largest first. */
export const CITY_LIST: City[] = [
  { id: 'new-york', name: 'New York', state: 'NY', center: { lat: 40.758, lng: -73.9855 }, terrain: 'none',
    landmarks: [L('wtc', 390, 70, 330, { s: 75, beacon: true }), L('spire', 545, 82, 300, { s: 75, color: GOLD, beacon: true }), L('sunburst', 715, 58, 285, { s: 85, color: SILVER }), L('block', 860, 30, 335), L('block', 930, 68, 230)] },
  { id: 'los-angeles', name: 'Los Angeles', state: 'CA', center: { lat: 34.0522, lng: -118.2437 }, terrain: 'range', props: ['palms'],
    landmarks: [L('crown', 450, 80, 300, { color: GOLD }), L('sail', 610, 76, 315, { s: 60, color: LED, beacon: true }), L('spire', 790, 84, 190, { s: 80, color: WARM }), L('block', 930, 64, 230)] },
  { id: 'chicago', name: 'Chicago', state: 'IL', center: { lat: 41.8781, lng: -87.6298 }, terrain: 'none',
    landmarks: [L('antenna2', 410, 112, 330, { s: 85, beacon: true }), L('spire', 590, 62, 300, { s: 60, color: SILVER }), L('taper', 715, 88, 300, { s: 75, beacon: true }), L('block', 870, 72, 300)] },
  { id: 'houston', name: 'Houston', state: 'TX', center: { lat: 29.7604, lng: -95.3698 }, terrain: 'none',
    landmarks: [L('wtc', 410, 86, 330, { s: 0 }), L('gable', 560, 86, 275, { color: WARM }), L('spire', 720, 66, 305, { s: 30, color: ICE, beacon: true }), L('prism', 860, 56, 235), L('prism', 935, 56, 235)] },
  { id: 'phoenix', name: 'Phoenix', state: 'AZ', center: { lat: 33.4484, lng: -112.074 }, terrain: 'mesa', props: ['saguaro'],
    landmarks: [L('block', 500, 72, 225), L('block', 610, 84, 255, { beacon: true }), L('prism', 760, 62, 205), L('block', 870, 60, 180)] },
  { id: 'philadelphia', name: 'Philadelphia', state: 'PA', center: { lat: 39.9526, lng: -75.1652 }, terrain: 'none',
    landmarks: [L('keyhole', 400, 80, 330), L('wtc', 545, 76, 300, { s: 0 }), L('spire', 685, 72, 300, { s: 85, color: ICE, beacon: true }), L('spire', 800, 62, 260, { s: 45, color: ICE }), L('spire', 915, 88, 165, { s: 120, color: GOLD })] },
  { id: 'san-antonio', name: 'San Antonio', state: 'TX', center: { lat: 29.4241, lng: -98.4936 }, terrain: 'hills',
    landmarks: [L('needle', 470, 100, 330, { color: GOLD, beacon: true }), L('spire', 620, 60, 225, { s: 40, color: WARM }), L('prism', 750, 72, 245), L('block', 880, 66, 185)] },
  { id: 'san-diego', name: 'San Diego', state: 'CA', center: { lat: 32.7157, lng: -117.1611 }, terrain: 'hills', props: ['palms'],
    landmarks: [L('cap', 470, 74, 305, { color: WARM, beacon: true }), L('prism', 620, 62, 245), L('block', 730, 68, 255), L('arch', 860, 58, 205)] },
  { id: 'dallas', name: 'Dallas', state: 'TX', center: { lat: 32.7767, lng: -96.797 }, terrain: 'none',
    landmarks: [L('sphere', 405, 0, 300, { color: GOLD }), L('keyhole', 495, 58, 245), L('xtower', 590, 56, 280, { color: WARM }), L('outline', 685, 74, 345, { color: GREEN, beacon: true }), L('arch', 805, 60, 295, { color: GOLD }), L('prism', 905, 78, 320)] },
  { id: 'fort-worth', name: 'Fort Worth', state: 'TX', center: { lat: 32.7555, lng: -97.3308 }, terrain: 'none',
    landmarks: [L('prism', 480, 62, 255), L('prism', 565, 62, 225), L('block', 665, 88, 275, { beacon: true }), L('cap', 800, 62, 245, { color: WARM }), L('block', 910, 62, 200)] },
  { id: 'jacksonville', name: 'Jacksonville', state: 'FL', center: { lat: 30.3322, lng: -81.6557 }, terrain: 'none', props: ['liftbridge'],
    landmarks: [L('spire', 420, 78, 300, { s: 45, color: ICE, beacon: true }), L('block', 555, 78, 260), L('arch', 680, 62, 220, { color: WARM })] },
  { id: 'austin', name: 'Austin', state: 'TX', center: { lat: 30.2672, lng: -97.7431 }, terrain: 'hills',
    landmarks: [L('stack', 420, 78, 320), L('gable', 560, 66, 275, { color: ICE }), L('dome', 670, 160, 195, { s: 55, color: GOLD }), L('block', 885, 50, 315, { beacon: true })] },
  { id: 'san-jose', name: 'San Jose', state: 'CA', center: { lat: 37.3382, lng: -121.8863 }, terrain: 'range', props: ['palms'],
    landmarks: [L('block', 480, 66, 195), L('dome', 590, 130, 150, { s: 25, color: SILVER }), L('block', 780, 66, 185), L('prism', 890, 58, 165)] },
  { id: 'charlotte', name: 'Charlotte', state: 'NC', center: { lat: 35.2271, lng: -80.8431 }, terrain: 'none',
    landmarks: [L('block', 420, 76, 280), L('crown', 545, 96, 335, { color: GOLD, beacon: true }), L('spire', 720, 66, 280, { s: 30, color: WARM }), L('prism', 850, 66, 250)] },
  { id: 'columbus', name: 'Columbus', state: 'OH', center: { lat: 39.9612, lng: -82.9988 }, terrain: 'none',
    landmarks: [L('spire', 480, 74, 275, { s: 80, color: GOLD, beacon: true }), L('block', 640, 88, 300), L('block', 790, 66, 240), L('arch', 900, 58, 210)] },
  { id: 'indianapolis', name: 'Indianapolis', state: 'IN', center: { lat: 39.7684, lng: -86.1581 }, terrain: 'none',
    landmarks: [L('cap', 430, 86, 305, { color: ICE, beacon: true }), L('obelisk', 650, 44, 210, { s: 45, color: GOLD }), L('block', 760, 72, 245), L('arch', 890, 58, 210)] },
  { id: 'san-francisco', name: 'San Francisco', state: 'CA', center: { lat: 37.7749, lng: -122.4194 }, terrain: 'hills', props: ['goldengate'],
    landmarks: [L('xtower', 420, 58, 300), L('arch', 520, 84, 345, { color: LED }), L('pyramid', 680, 90, 315, { color: GOLD }), L('block', 820, 72, 250)] },
  { id: 'seattle', name: 'Seattle', state: 'WA', center: { lat: 47.6062, lng: -122.3321 }, terrain: 'peak',
    landmarks: [L('needle', 420, 110, 320, { color: GOLD, beacon: true }), L('prism', 560, 90, 335), L('block', 700, 66, 260), L('arch', 800, 62, 230)] },
  { id: 'denver', name: 'Denver', state: 'CO', center: { lat: 39.7392, lng: -104.9903 }, terrain: 'range',
    landmarks: [L('block', 480, 80, 295, { beacon: true }), L('arch', 615, 84, 275, { color: GOLD }), L('block', 765, 66, 240), L('prism', 875, 62, 220)] },
  { id: 'nashville', name: 'Nashville', state: 'TN', center: { lat: 36.1627, lng: -86.7816 }, terrain: 'hills',
    landmarks: [L('block', 430, 68, 230), L('twinspire', 560, 98, 325, { s: 100, beacon: true }), L('gable', 745, 70, 265, { color: WARM }), L('block', 870, 62, 215)] },
];

export const CITIES: Record<string, City> = Object.fromEntries(CITY_LIST.map((c) => [c.id, c]));

/** Launch market and fallback. */
export const DEFAULT_CITY: City = CITIES.dallas;
export const CITY: City = DEFAULT_CITY;
