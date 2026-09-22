"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { repo } from "@/lib/repo";
import { useSession } from "@/lib/session";
import { WOLGYE_CENTER } from "@/lib/geo";
import { drafter, type PostDraft } from "@/lib/ai/draft";
import type { Category, RoleSlot } from "@/types";

const CATS: Category[] = ["디자인", "영상", "사진", "SNS홍보", "웹/앱", "디지털도움", "기타"];

/** 공고 등록 (주민·상인). 고민을 대충 적으면 AI 초안이 폼을 채워 주고, 사장님이 확인·수정 후 등록한다.
 *  위치는 계정 위치를 기본값으로 쓰고, 지도에서 고르는 기능은 TODO. */
export default function NewPost() {
  const router = useRouter();
  const { user } = useSession();
  const [f, setF] = useState({ title: "", category: "디자인" as Category, description: "", reward: "", durationDays: 7, difficulty: 2 as 1 | 2 | 3, isTeam: false });
  const [slots, setSlots] = useState<RoleSlot[]>([{ category: "디자인", count: 1, filled: [] }]);
  const [memo, setMemo] = useState("");
  const [draft, setDraft] = useState<PostDraft | null>(null);
  const [drafting, setDrafting] = useState(false);
  if (user?.role !== "resident") return <><TopBar title="공고 등록" back /><p className="sub p-6 text-center text-sm">주민·상인 계정으로 전환하면 공고를 등록할 수 있어요. (나 › 계정 전환)</p></>;

  async function submit() {
    if (!f.title.trim()) return alert("제목을 입력해 주세요");
    const p = await repo.createPost({ ...f, authorId: user!.id, location: user!.location ?? WOLGYE_CENTER, address: (user as { address?: string }).address ?? "월계1동", teamSlots: f.isTeam ? slots : undefined });
    router.replace(`/posts/detail?id=${p.id}`);
  }
  async function makeDraft() {
    if (!memo.trim()) return alert("가게 고민을 한 줄이라도 적어 주세요");
    setDrafting(true);
    const d = await drafter.draft(memo);
    setDraft(d);
    setF({ title: d.title, category: d.category, description: d.description, reward: d.reward ?? f.reward, durationDays: d.durationDays, difficulty: d.difficulty, isTeam: d.isTeam });
    if (d.teamSlots) setSlots(d.teamSlots);
    setDrafting(false);
  }
  const field = "w-full rounded-xl bg-[var(--line)] p-3 text-[15px] outline-none";
  return (
    <>
      <TopBar title="공고 등록" back />
      <section className="flex flex-col gap-3 px-4">
        <div className="card flex flex-col gap-3">
          <div><h2 className="font-bold">✨ 대충 적으면 AI가 공고를 써 드려요</h2><p className="sub mt-0.5 text-xs">어떤 재능이 필요한지 몰라도 괜찮아요. 가게 고민만 편하게 적어 주세요.</p></div>
          <textarea className={`${field} h-24`} placeholder="예: 메뉴판이 낡아서 손님들이 잘 못 알아봐요. 폰으로 QR 찍어서 메뉴 보게 하고 싶어요. 메뉴 20개 정도" value={memo} onChange={(e) => setMemo(e.target.value)} />
          <button onClick={makeDraft} disabled={drafting} className="btn btn-primary w-full disabled:opacity-50">{drafting ? "초안 만드는 중…" : "공고 초안 만들기"}</button>
          {draft && (
            <div className="rounded-xl bg-[var(--primary-weak)] p-3 text-sm">
              <p className="font-bold text-[var(--primary)]">AI 초안 · 아래 폼에 채워 두었어요</p>
              <dl className="mt-2 flex flex-col gap-1">
                <div className="flex gap-2"><dt className="sub w-16 shrink-0">제목</dt><dd className="font-semibold">{draft.title}</dd></div>
                <div className="flex gap-2"><dt className="sub w-16 shrink-0">필요 재능</dt><dd>{draft.teamSlots ? draft.teamSlots.map((s) => `${s.category} ${s.count}명`).join(", ") + " (팀 공고로 제안)" : `${draft.category} 1명`}</dd></div>
                <div className="flex gap-2"><dt className="sub w-16 shrink-0">추천 학과</dt><dd>{draft.departments.join(", ")}</dd></div>
                {draft.deliverables.length > 0 && <div className="flex gap-2"><dt className="sub w-16 shrink-0">결과물</dt><dd>{draft.deliverables.join(", ")}</dd></div>}
                <div className="flex gap-2"><dt className="sub w-16 shrink-0">기간·난이도</dt><dd>{draft.durationDays % 7 === 0 ? `${draft.durationDays / 7}주` : `${draft.durationDays}일`} / {"★".repeat(draft.difficulty)}</dd></div>
              </dl>
              {draft.reasons.length > 0 && <ul className="sub mt-2 list-disc pl-4 text-xs">{draft.reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
              <p className="sub mt-2 text-xs">내용을 확인하고 필요하면 고친 뒤 등록해 주세요.</p>
            </div>
          )}
        </div>
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
