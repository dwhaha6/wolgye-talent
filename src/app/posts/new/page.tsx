"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { repo } from "@/lib/repo";
import { useSession } from "@/lib/session";
import { WOLGYE_CENTER } from "@/lib/geo";
import type { Category, RoleSlot } from "@/types";

const CATS: Category[] = ["디자인", "영상", "사진", "SNS홍보", "웹/앱", "디지털도움", "기타"];

/** 공고 등록 (주민·상인). 위치는 계정 위치를 기본값으로 쓰고, 지도에서 고르는 기능은 TODO. */
export default function NewPost() {
  const router = useRouter();
  const { user } = useSession();
  const [f, setF] = useState({ title: "", category: "디자인" as Category, description: "", reward: "", durationDays: 7, difficulty: 2 as 1 | 2 | 3, isTeam: false });
  const [slots, setSlots] = useState<RoleSlot[]>([{ category: "디자인", count: 1, filled: [] }]);
  if (user?.role !== "resident") return <><TopBar title="공고 등록" back /><p className="sub p-6 text-center text-sm">주민·상인 계정으로 전환하면 공고를 등록할 수 있어요. (나 › 계정 전환)</p></>;

  async function submit() {
    if (!f.title.trim()) return alert("제목을 입력해 주세요");
    const p = await repo.createPost({ ...f, authorId: user!.id, location: user!.location ?? WOLGYE_CENTER, address: (user as { address?: string }).address ?? "월계1동", teamSlots: f.isTeam ? slots : undefined });
    router.replace(`/posts/${p.id}`);
  }
  const field = "w-full rounded-xl bg-[var(--line)] p-3 text-[15px] outline-none";
  return (
    <>
      <TopBar title="공고 등록" back />
      <section className="flex flex-col gap-3 px-4">
        <div className="card flex flex-col gap-3">
          <input className={field} placeholder="어떤 도움이 필요한가요? (예: 메뉴판 디자인)" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1">{CATS.map((c) => <button key={c} onClick={() => setF({ ...f, category: c })} className={`chip ${f.category === c ? "chip-on" : ""}`}>{c}</button>)}</div>
          <textarea className={`${field} h-28`} placeholder="자세한 내용, 원하는 결과물, 가능한 시간" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          <input className={field} placeholder="보상 (선택: 사례비, 식사권, 쿠폰…)" value={f.reward} onChange={(e) => setF({ ...f, reward: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm"><span className="sub block text-xs">예상 기간(일)</span><input type="number" min={1} className={field} value={f.durationDays} onChange={(e) => setF({ ...f, durationDays: +e.target.value })} /></label>
            <label className="text-sm"><span className="sub block text-xs">난이도</span><select className={field} value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: +e.target.value as 1 | 2 | 3 })}><option value={1}>★ 쉬움</option><option value={2}>★★ 보통</option><option value={3}>★★★ 어려움</option></select></label>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isTeam} onChange={(e) => setF({ ...f, isTeam: e.target.checked })} /> 여러 명이 필요한 팀 프로젝트예요</label>
          {f.isTeam && (
            <div className="rounded-xl bg-[var(--line)] p-3 text-sm">
              {slots.map((s, i) => (
                <div key={i} className="mb-2 flex gap-2">
                  <select className="flex-1 rounded-lg bg-white p-2" value={s.category} onChange={(e) => setSlots(slots.map((x, j) => j === i ? { ...x, category: e.target.value as Category } : x))}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
                  <input type="number" min={1} className="w-16 rounded-lg bg-white p-2" value={s.count} onChange={(e) => setSlots(slots.map((x, j) => j === i ? { ...x, count: +e.target.value } : x))} />
                </div>
              ))}
              <button onClick={() => setSlots([...slots, { category: "영상", count: 1, filled: [] }])} className="text-[var(--primary)]">+ 역할 추가</button>
            </div>
          )}
        </div>
        <button onClick={submit} className="btn btn-primary w-full">등록하기</button>
        <p className="sub text-center text-xs">등록되면 관심 분야·거리가 맞는 학생에게 알림이 갑니다.</p>
      </section>
    </>
  );
}
