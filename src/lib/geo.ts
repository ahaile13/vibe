import type { LatLng } from './types';

export const DALLAS: LatLng = { lat: 32.7767, lng: -96.797 };

export function distanceM(a: LatLng, b: LatLng) {
  const R = 6371e3, t = Math.PI / 180;
  const dl = (b.lat - a.lat) * t, dg = (b.lng - a.lng) * t;
  const x = Math.sin(dl / 2) ** 2 + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dg / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export const distanceMi = (a: LatLng, b: LatLng) => distanceM(a, b) / 1609.34;

export const fmtMi = (mi: number | null) => (mi == null ? '' : mi < 0.1 ? '<0.1 mi' : `${mi.toFixed(1)} mi`);

export interface Fix extends LatLng {
  accuracy: number;
}

export type FixError = 'denied' | 'nofix' | 'unsupported';

/** One fresh, high-accuracy reading. Never watches in the background. */
export function getFix(timeout = 12_000): Promise<Fix> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return reject('unsupported' as FixError);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      (e) => reject((e.code === 1 ? 'denied' : 'nofix') as FixError),
      { enableHighAccuracy: true, maximumAge: 0, timeout },
    );
  });
}

export const directionsUrl = (p: LatLng) => `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
