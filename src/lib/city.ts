import type { LatLng } from './types';

/**
 * Skyline shapes. All numbers are in a 1440 x 480 drawing: x is the left edge
 * (or center for 'sphere' and 'needle'), w the width, h the height above the
 * street line, s an optional spire/antenna height. Keep a city's signature
 * buildings between x 380 and 1080 so they stay visible on phones.
 */
export type LandmarkKind =
  | 'sphere' // tower topped by a lit globe (Reunion Tower)
  | 'needle' // thin stem with a saucer top (Space Needle, Tower of the Americas)
  | 'outline' // tower traced in colored light (Bank of America Plaza, Dallas)
  | 'prism' // faceted glass top
  | 'xtower' // X-braced tower with twin masts
  | 'arch' // rounded crown
  | 'keyhole' // opening near the top
  | 'spire' // setbacks finishing in a spire (Empire State, One Liberty Place)
  | 'wtc' // chamfered taper with a tall spire (One World Trade)
  | 'antenna2' // stacked setbacks with two antennas (Willis Tower)
  | 'taper' // tapered, X-braced, two antennas (875 N Michigan)
  | 'pyramid' // tall pyramid (Transamerica)
  | 'crown' // ring of spikes (Bank of America Corporate Center)
  | 'twinspire' // two corner spires (AT&T "Batman" building)
  | 'dome' // capitol or city hall dome
  | 'stack' // offset stacked blocks (The Independent)
  | 'gable' // stepped gables (Bank of America Center, Houston)
  | 'block';

export interface Landmark {
  kind: LandmarkKind;
  x: number;
  w?: number;
  h: number;
  s?: number;
  color?: string;
}

/** What rises behind the buildings. */
export type Terrain = 'none' | 'range' | 'peak' | 'hills' | 'mesa';

export interface City {
  id: string;
  name: string;
  state: string;
  center: LatLng;
  terrain: Terrain;
  landmarks: Landmark[];
}

const L = (kind: LandmarkKind, x: number, w: number, h: number, s?: number, color?: string): Landmark => ({ kind, x, w, h, s, color });

/** The 20 most populated US cities (Census Bureau estimates), largest first. */
export const CITY_LIST: City[] = [
  { id: 'new-york', name: 'New York', state: 'NY', center: { lat: 40.758, lng: -73.9855 }, terrain: 'none',
    landmarks: [L('wtc', 400, 74, 300, 70), L('block', 500, 52, 250), L('spire', 590, 74, 290, 70), L('block', 690, 30, 335), L('spire', 750, 56, 280, 60), L('prism', 850, 74, 290), L('block', 960, 60, 250), L('block', 1040, 44, 230)] },
  { id: 'los-angeles', name: 'Los Angeles', state: 'CA', center: { lat: 34.0522, lng: -118.2437 }, terrain: 'range',
    landmarks: [L('block', 430, 56, 200), L('crown', 520, 66, 300), L('spire', 640, 66, 300, 40), L('prism', 760, 60, 250), L('block', 860, 64, 230), L('spire', 960, 56, 170, 50)] },
  { id: 'chicago', name: 'Chicago', state: 'IL', center: { lat: 41.8781, lng: -87.6298 }, terrain: 'none',
    landmarks: [L('block', 400, 54, 240), L('antenna2', 470, 96, 320, 70), L('spire', 600, 56, 290, 50), L('taper', 700, 70, 300, 60), L('block', 820, 60, 290), L('arch', 920, 56, 240), L('prism', 1010, 56, 230)] },
  { id: 'houston', name: 'Houston', state: 'TX', center: { lat: 29.7604, lng: -95.3698 }, terrain: 'none',
    landmarks: [L('block', 420, 60, 230), L('block', 500, 78, 330), L('gable', 610, 74, 270), L('block', 720, 70, 310), L('prism', 830, 56, 240), L('prism', 900, 56, 240), L('spire', 990, 60, 280, 40)] },
  { id: 'phoenix', name: 'Phoenix', state: 'AZ', center: { lat: 33.4484, lng: -112.074 }, terrain: 'mesa',
    landmarks: [L('block', 470, 60, 200), L('block', 560, 70, 240), L('prism', 670, 60, 200), L('block', 760, 56, 180), L('arch', 850, 54, 170), L('block', 940, 60, 160)] },
  { id: 'philadelphia', name: 'Philadelphia', state: 'PA', center: { lat: 39.9526, lng: -75.1652 }, terrain: 'none',
    landmarks: [L('keyhole', 440, 66, 330), L('wtc', 560, 66, 300, 0), L('spire', 670, 60, 290, 70), L('spire', 770, 54, 250, 40), L('spire', 880, 74, 160, 90), L('block', 1000, 60, 220)] },
  { id: 'san-antonio', name: 'San Antonio', state: 'TX', center: { lat: 29.4241, lng: -98.4936 }, terrain: 'hills',
    landmarks: [L('needle', 440, 72, 320), L('block', 550, 56, 190), L('prism', 640, 62, 230), L('spire', 750, 52, 200, 40), L('block', 850, 60, 170), L('arch', 950, 52, 160)] },
  { id: 'san-diego', name: 'San Diego', state: 'CA', center: { lat: 32.7157, lng: -117.1611 }, terrain: 'hills',
    landmarks: [L('block', 450, 56, 210), L('prism', 540, 60, 230), L('block', 640, 66, 250), L('arch', 750, 52, 200), L('block', 840, 60, 220), L('prism', 940, 54, 190)] },
  { id: 'dallas', name: 'Dallas', state: 'TX', center: { lat: 32.7767, lng: -96.797 }, terrain: 'none',
    landmarks: [L('sphere', 405, 0, 300), L('keyhole', 500, 58, 245), L('xtower', 598, 54, 280), L('outline', 690, 70, 345, undefined, '#7fbf9f'), L('arch', 800, 58, 295), L('prism', 900, 74, 320), L('block', 1010, 62, 205)] },
  { id: 'fort-worth', name: 'Fort Worth', state: 'TX', center: { lat: 32.7555, lng: -97.3308 }, terrain: 'none',
    landmarks: [L('block', 470, 74, 260), L('block', 570, 60, 220), L('prism', 670, 56, 240), L('prism', 750, 56, 210), L('block', 840, 64, 230), L('arch', 940, 52, 180)] },
  { id: 'jacksonville', name: 'Jacksonville', state: 'FL', center: { lat: 30.3322, lng: -81.6557 }, terrain: 'none',
    landmarks: [L('block', 450, 56, 200), L('spire', 540, 66, 280, 40), L('block', 650, 66, 250), L('arch', 760, 56, 210), L('block', 850, 60, 200), L('prism', 950, 54, 180)] },
  { id: 'austin', name: 'Austin', state: 'TX', center: { lat: 30.2672, lng: -97.7431 }, terrain: 'hills',
    landmarks: [L('stack', 440, 70, 300), L('gable', 560, 60, 260), L('dome', 660, 120, 170, 40), L('block', 820, 46, 290), L('prism', 900, 58, 240), L('block', 990, 56, 220)] },
  { id: 'san-jose', name: 'San Jose', state: 'CA', center: { lat: 37.3382, lng: -121.8863 }, terrain: 'range',
    landmarks: [L('block', 480, 60, 180), L('block', 570, 56, 160), L('dome', 660, 90, 120, 20), L('block', 790, 60, 170), L('prism', 880, 54, 150), L('block', 970, 56, 140)] },
  { id: 'charlotte', name: 'Charlotte', state: 'NC', center: { lat: 35.2271, lng: -80.8431 }, terrain: 'none',
    landmarks: [L('block', 450, 56, 220), L('block', 530, 66, 270), L('crown', 640, 76, 320), L('spire', 760, 58, 270, 30), L('prism', 870, 60, 240), L('block', 970, 56, 200)] },
  { id: 'columbus', name: 'Columbus', state: 'OH', center: { lat: 39.9612, lng: -82.9988 }, terrain: 'none',
    landmarks: [L('block', 460, 56, 200), L('spire', 550, 56, 250, 50), L('block', 660, 72, 280), L('block', 780, 60, 230), L('arch', 880, 56, 200), L('prism', 970, 54, 180)] },
  { id: 'indianapolis', name: 'Indianapolis', state: 'IN', center: { lat: 39.7684, lng: -86.1581 }, terrain: 'none',
    landmarks: [L('prism', 460, 56, 210), L('spire', 560, 76, 300, 30), L('spire', 690, 30, 150, 60), L('block', 770, 62, 230), L('arch', 870, 56, 200), L('block', 960, 56, 180)] },
  { id: 'san-francisco', name: 'San Francisco', state: 'CA', center: { lat: 37.7749, lng: -122.4194 }, terrain: 'hills',
    landmarks: [L('block', 440, 56, 230), L('xtower', 520, 52, 290), L('arch', 620, 68, 340), L('pyramid', 760, 74, 300), L('block', 870, 64, 250), L('prism', 960, 56, 220)] },
  { id: 'seattle', name: 'Seattle', state: 'WA', center: { lat: 47.6062, lng: -122.3321 }, terrain: 'peak',
    landmarks: [L('needle', 410, 84, 300), L('block', 500, 52, 220), L('prism', 570, 74, 320), L('block', 670, 58, 260), L('arch', 750, 54, 230), L('block', 830, 50, 170)] },
  { id: 'denver', name: 'Denver', state: 'CO', center: { lat: 39.7392, lng: -104.9903 }, terrain: 'range',
    landmarks: [L('block', 460, 56, 220), L('block', 550, 68, 280), L('arch', 670, 66, 260), L('block', 790, 60, 240), L('prism', 890, 56, 220), L('block', 980, 54, 190)] },
  { id: 'nashville', name: 'Nashville', state: 'TN', center: { lat: 36.1627, lng: -86.7816 }, terrain: 'hills',
    landmarks: [L('block', 470, 60, 230), L('twinspire', 580, 76, 300, 70), L('gable', 720, 60, 250), L('block', 820, 56, 220), L('prism', 910, 56, 200), L('block', 1000, 52, 180)] },
];

export const CITIES: Record<string, City> = Object.fromEntries(CITY_LIST.map((c) => [c.id, c]));

/** Launch market and fallback. */
export const DEFAULT_CITY: City = CITIES.dallas;
export const CITY: City = DEFAULT_CITY;
