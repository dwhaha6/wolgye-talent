import type { GeoPoint } from "@/types";

// 월계1동 대략 중심 / 광운대 정문
export const WOLGYE_CENTER: GeoPoint = { lat: 37.6265, lng: 127.0605 };
export const KWANGWOON: GeoPoint = { lat: 37.6196, lng: 127.0592 };

export function distanceM(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)));
}

export const walkMinutes = (m: number) => Math.max(1, Math.round(m / 75)); // 도보 4.5 km/h

export function formatDistance(m: number) {
  return m < 1000 ? `${m}m · 도보 ${walkMinutes(m)}분` : `${(m / 1000).toFixed(1)}km · 도보 ${walkMinutes(m)}분`;
}
