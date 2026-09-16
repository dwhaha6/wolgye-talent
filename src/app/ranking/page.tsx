"use client";
import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import { repo } from "@/lib/repo";
import type { RankRow } from "@/types";

const KINDS = [["individual", "개인"], ["team", "팀"], ["department", "학과"]] as const;
const MEDAL = ["🥇", "🥈", "🥉"];

/** ③ 지역 기여 랭킹: 해결 수·평가·난이도 기반 점수. 점수 공식은 repo.ranking 에 있음. */
export default function Ranking() {
  const [kind, setKind] = useState<(typeof KINDS)[number][0]>("individual");
  const [rows, setRows] = useState<RankRow[]>([]);
  useEffect(() => { repo.ranking(kind).then(setRows); }, [kind]);
  return (
    <>
      <TopBar title="지역 기여 랭킹" />
      <section className="px-4">
        <div className="mb-3 flex gap-2">{KINDS.map(([k, l]) => <button key={k} onClick={() => setKind(k)} className={`chip ${kind === k ? "chip-on" : ""}`}>{l}</button>)}</div>
        <ul className="card flex flex-col divide-y divide-[var(--line)] p-0">
          {rows.map((r, i) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-3">
              <span className="w-7 text-center text-lg">{MEDAL[i] ?? i + 1}</span>
              <div className="flex-1"><p className="font-semibold">{r.label}</p><p className="sub text-xs">{r.sub} · {r.solved}개 해결</p></div>
              <span className="font-bold text-[var(--primary)]">{r.score}점</span>
            </li>
          ))}
          {rows.length === 0 && <li className="sub p-6 text-center text-sm">아직 기록이 없어요</li>}
        </ul>
        <p className="sub mt-3 text-xs">점수 = 해결 수×10 + 평가 평균×4 + 난이도 합×3 (임시). 팀 랭킹은 팀 기능이 붙으면 채워집니다.</p>
      </section>
    </>
  );
}
