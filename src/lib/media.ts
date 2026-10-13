export interface PreparedPhoto {
  kind: 'photo';
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
}
export interface PreparedVideo {
  kind: 'video';
  file: File;
  previewUrl: string;
  thumb: Blob | null;
  width: number;
  height: number;
  duration: number;
}
export type Prepared = PreparedPhoto | PreparedVideo;

export const MAX_VIDEO_SECONDS = 10;
export const MAX_BYTES = 50 * 1024 * 1024;
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

export class MediaError extends Error {}

function canvasBlob(c: HTMLCanvasElement, q = 0.8): Promise<Blob> {
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new MediaError('Couldn’t process that image.'))), 'image/jpeg', q));
}

/** Resizes to 1440px on the long edge and re-encodes as JPEG (also strips EXIF/GPS). */
export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new MediaError('That image couldn’t be read. Try a JPG or PNG.'));
      i.src = url;
    });
    const k = Math.min(1, 1440 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    const blob = await canvasBlob(c, 0.82);
    return { kind: 'photo', blob, previewUrl: URL.createObjectURL(blob), width: c.width, height: c.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function prepareVideo(file: File): Promise<PreparedVideo> {
  if (!VIDEO_TYPES.includes(file.type)) throw new MediaError('That video format isn’t supported. Use MP4, MOV or WebM.');
  if (file.size > MAX_BYTES) throw new MediaError('That clip is over 50 MB. Record a shorter or lower-quality one.');
  const url = URL.createObjectURL(file);
  const v = document.createElement('video');
  v.preload = 'auto';
  v.muted = true;
  v.playsInline = true;
  v.src = url;
  await new Promise<void>((res, rej) => {
    v.onloadedmetadata = () => res();
    v.onerror = () => rej(new MediaError('That video couldn’t be read on this device.'));
  });
  if (!Number.isFinite(v.duration) || v.duration > MAX_VIDEO_SECONDS + 0.5) {
    URL.revokeObjectURL(url);
    throw new MediaError(`Clips can be up to ${MAX_VIDEO_SECONDS} seconds. This one is ${Math.round(v.duration)}s.`);
  }
  let thumb: Blob | null = null;
  try {
    v.currentTime = Math.min(0.5, v.duration / 2);
    await new Promise<void>((res) => { v.onseeked = () => res(); setTimeout(res, 2500); });
    const k = Math.min(1, 720 / Math.max(v.videoWidth, v.videoHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(v.videoWidth * k);
    c.height = Math.round(v.videoHeight * k);
    c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height);
    thumb = await canvasBlob(c, 0.75);
  } catch {
    thumb = null;
  }
  return { kind: 'video', file, previewUrl: url, thumb, width: v.videoWidth, height: v.videoHeight, duration: v.duration };
}

export const videoExt = (type: string) => (type === 'video/quicktime' ? 'mov' : type === 'video/webm' ? 'webm' : 'mp4');
