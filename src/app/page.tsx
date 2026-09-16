"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import PostCard from "@/components/PostCard";
import EmptyState from "@/components/EmptyState";
import { repo } from "@/lib/repo";
import { useSession } from "@/lib/session";
import { distanceM } from "@/lib/geo";
import { recommendScore } from "@/lib/recommend";
import type { Category, Post, User } from "@/types";

const CATS: ("전체" | Category)[] = ["전체", "디자인", "영상", "사진", "SNS홍보", "웹/앱", "디지털도움", "기타"];

/** 홈: ① 맞춤 공고 추천 피드. 학생이면 적합도 순, 주민이면 내 공고 위주. */
export default function Home() {
  const { user, users } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [cat, setCat] = useState<(typeof CATS)[number]>("전체");
  const [onlyOpen, setOnlyOpen] = useState(true);
  useEffect(() => { repo.listPosts().then(setPosts); }, []);
  const name = (id: string) => users.find((u) => u.id === id)?.name;

  const rows = useMemo(() => {
    let list = posts.filter((p) => (cat === "전체" || p.category === cat) && (!onlyOpen || p.status !== "done"));
    if (user?.role === "student") {
      return list.map((p) => ({ p, d: distanceM(user.location, p.location), s: recommendScore(user, p) })).sort((a, b) => b.s - a.s);
    }
    if (user?.role === "resident") list = [...list.filter((p) => p.authorId === user.id), ...list.filter((p) => p.authorId !== user.id)];
    return list.map((p) => ({ p, d: user ? distanceM(user.location, p.location) : undefined, s: undefined as number | undefined }));
  }, [posts, cat, onlyOpen, user]);

  return (
    <>
      <TopBar title="월계1동" />
      <section className="px-4">
        <div className="card mb-4 flex items-center justify-between bg-[var(--primary)] text-white">
          <div>
            <p className="text-sm opacity-90">{greeting(user)}</p>
            <p className="mt-1 text-lg font-bold">{user?.role === "resident" ? "필요한 재능을 등록해 보세요" : "학교 가는 길에 할 수 있는 프로젝트"}</p>
          </div>
          <Link href={user?.role === "resident" ? "/posts/new" : "/map"} className="btn bg-white/20 px-3 py-2 text-sm">{user?.role === "resident" ? "등록" : "지도"}</Link>
        </div>
        <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
          {CATS.map((c) => <button key={c} onClick={() => setCat(c)} className={`chip ${cat === c ? "chip-on" : ""}`}>{c}</button>)}
        </div>
        <label className="sub mb-3 flex items-center gap-2 text-xs"><input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} /> 완료된 공고 숨기기</label>
        <div className="flex flex-col gap-3">
          {rows.length === 0 && <EmptyState text="조건에 맞는 공고가 없어요" />}
          {rows.map(({ p, d, s }) => <PostCard key={p.id} post={p} authorName={name(p.authorId)} distance={d} score={s} />)}
        </div>
      </section>
    </>
  );
}
function greeting(u: User | null) {
  if (!u) return "안녕하세요";
  return u.role === "student" ? `${u.name} · ${u.department}` : `${u.name} · ${u.kind}`;
}
