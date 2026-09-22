"use client";
import { MapContainer, TileLayer, CircleMarker, Popup, Marker } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import type { GeoPoint, Post } from "@/types";
import { STATUS } from "./StatusBadge";
import { formatDistance, distanceM } from "@/lib/geo";

const COLOR: Record<Post["status"], string> = { open: "#f04452", in_progress: "#ffb331", done: "#2ac769" };
const meIcon = L.divIcon({ className: "", html: '<div style="width:16px;height:16px;border-radius:50%;background:#3182f6;border:3px solid white;box-shadow:0 0 0 2px #3182f6"></div>', iconSize: [16, 16], iconAnchor: [8, 8] });

/** OpenStreetMap + Leaflet. API 키 없음. 카카오/네이버 지도로 바꾸려면 이 컴포넌트만 교체. */
export default function MapView({ posts, me, center }: { posts: Post[]; me?: GeoPoint; center: GeoPoint }) {
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={15} className="h-full w-full" scrollWheelZoom>
      <TileLayer attribution='&copy; OpenStreetMap' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {me && <Marker position={[me.lat, me.lng]} icon={meIcon} />}
      {posts.map((p) => (
        <CircleMarker key={p.id} center={[p.location.lat, p.location.lng]} radius={11} pathOptions={{ color: "white", weight: 2, fillColor: COLOR[p.status], fillOpacity: 0.95 }}>
          <Popup>
            <div className="min-w-[160px] text-sm">
              <div className="text-xs">{STATUS[p.status].dot} {STATUS[p.status].label} · {p.category}</div>
              <div className="mt-1 font-bold">{p.title}</div>
              {me && <div className="mt-1 text-xs text-gray-500">📍 {formatDistance(distanceM(me, p.location))}</div>}
              <Link href={`/posts/detail?id=${p.id}`} className="mt-2 block font-semibold text-[var(--primary)]">자세히 보기 ›</Link>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
