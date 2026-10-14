import type { LatLng } from './types';

/**
 * Landmark shapes the skyline knows how to draw. x and w are in a 1440-wide
 * drawing; h is height above the street line (the drawing is 480 tall).
 */
export type Landmark =
  | { kind: 'sphere'; x: number; h: number } // observation tower with a lit globe (Reunion Tower)
  | { kind: 'outline'; x: number; w: number; h: number; color: string } // tower traced in light (Bank of America Plaza)
  | { kind: 'prism'; x: number; w: number; h: number } // faceted glass prism (Fountain Place)
  | { kind: 'xtower'; x: number; w: number; h: number } // X-braced tower with spires (Renaissance Tower)
  | { kind: 'arch'; x: number; w: number; h: number } // tower with a rounded crown (Comerica Bank Tower)
  | { kind: 'keyhole'; x: number; w: number; h: number } // tower with an opening near the top (Chase Tower)
  | { kind: 'block'; x: number; w: number; h: number };

export interface City {
  id: string;
  name: string;
  state: string;
  center: LatLng;
  landmarks: Landmark[];
}

export const CITIES: Record<string, City> = {
  dallas: {
    id: 'dallas',
    name: 'Dallas',
    state: 'TX',
    center: { lat: 32.7767, lng: -96.797 },
    landmarks: [
      { kind: 'sphere', x: 405, h: 300 },
      { kind: 'keyhole', x: 500, w: 58, h: 245 },
      { kind: 'xtower', x: 598, w: 54, h: 280 },
      { kind: 'outline', x: 690, w: 70, h: 345, color: '#7fbf9f' },
      { kind: 'arch', x: 800, w: 58, h: 295 },
      { kind: 'prism', x: 900, w: 74, h: 320 },
      { kind: 'block', x: 1010, w: 62, h: 205 },
    ],
  },
};

/** The launch market. Switch this (or read it from the user) to change cities. */
export const CITY: City = CITIES.dallas;
