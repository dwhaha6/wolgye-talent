"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import { repo } from "@/lib/repo";
import { useSession } from "@/lib/session";
import { WOLGYE_CENTER } from "@/lib/geo";
import type { Post } from "@/types";

// Leaflet 은 브라우저 전용이라 서버 렌더링을 끈다.
const MapView = dynamic(() => import("@/components/MapView"), { ssr: false, loading: () => <div className="sub p-6 text-center text-sm">지도를 불러오는 중…</div> });

/** ② 위치 기반 MAP: 주변 공고와 상태(🔴🟡🟢), 내 위치에서의 거리·도보 시간 */
export default function MapPage() {
  const { user } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [hideDone, setHideDone] = useState(false);
  useEffect(() => { repo.listPosts().then(setPosts); }, []);
  const shown = hideDone ? posts.filter((p) => p.status !== "done") : posts;
  return (
    <>
      <TopBar title="주변 프로젝트" right={<label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} />완료 숨김</label>} />
      <div className="sub flex gap-3 px-4 pb-2 text-xs"><span>🔴 모집 중</span><span>🟡 진행 중</span><span>🟢 해결 완료</span><span className="ml-auto">🔵 내 위치</span></div>
      <div className="h-[calc(100vh-11rem)] overflow-hidden rounded-t-3xl">
        <MapView posts={shown} me={user?.location} center={user?.location ?? WOLGYE_CENTER} />
      </div>
    </>
  );
}
