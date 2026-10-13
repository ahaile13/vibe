export const CATEGORIES = ['Clubs', 'Bars', 'Restaurants', 'Parties', 'Concerts', 'Events', 'Sports'] as const;
export type Category = (typeof CATEGORIES)[number];
export type VibeLevel = 'popping' | 'mid' | 'dead';

export interface EventRow {
  id: string;
  venue_id: string | null;
  name: string;
  category: Category;
  description: string | null;
  area: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  radius_m: number;
  starts_at: string;
  ends_at: string;
  visibility: 'public' | 'unlisted';
  cover_charge: string | null;
  age_rule: string | null;
  ticket_url: string | null;
  save_count: number;
  created_by: string | null;
  is_demo: boolean;
}

export const EVENT_COLS =
  'id,venue_id,name,category,description,area,address,lat,lng,radius_m,starts_at,ends_at,visibility,cover_charge,age_rule,ticket_url,save_count,created_by,is_demo';

export interface RatingRow {
  event_id: string;
  vibe: VibeLevel;
  worth: boolean;
  at: string;
}

export interface MyRating {
  vibe: VibeLevel;
  worth: boolean;
  at: string;
}

export interface Profile {
  id: string;
  username: string;
  bio: string | null;
  home_city: string;
  avatar_url: string | null;
}

export interface Author {
  username: string;
  avatar_url: string | null;
}

export interface CommentRow {
  id: string;
  user_id: string;
  event_id: string;
  body: string;
  helpful_count: number;
  created_at: string;
  profiles: Author | null;
}
export const COMMENT_COLS = 'id,user_id,event_id,body,helpful_count,created_at,profiles(username,avatar_url)';

export interface PostRow {
  id: string;
  user_id: string;
  event_id: string;
  kind: 'photo' | 'video';
  media_path: string;
  thumb_path: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  duration_s: number | null;
  created_at: string;
  profiles: Author | null;
}
export const POST_COLS =
  'id,user_id,event_id,kind,media_path,thumb_path,caption,width,height,duration_s,created_at,profiles(username,avatar_url)';

export interface LatLng {
  lat: number;
  lng: number;
}
