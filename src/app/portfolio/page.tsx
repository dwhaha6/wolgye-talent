"use client";
import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import EmptyState from "@/components/EmptyState";
import { repo } from "@/lib/repo";
import { useSession } from "@/lib/session";
import type { PortfolioCard } from "@/types";

/** ④ 인증형 포트폴리오: 완료된 프로젝트마다 자동 생성되는 활동 카드 */
export default function Portfolio() {
  const { user } = useSession();
  const [cards, setCards] = useState<PortfolioCard[]>([]);
  useEffect(() => { if (user?.role === "student") repo.listPortfolio(user.id).then(setCards); }, [user]);
  return (
    <>
      <TopBar title="내 포트폴리오" back />
      <section className="flex flex-col gap-3 px-4">
        {user?.role !== "student" && <EmptyState text="학생 계정에서 볼 수 있어요" />}
        {user?.role === "student" && cards.length === 0 && <EmptyState text="완료한 프로젝트가 생기면 카드가 만들어져요" />}
        {cards.map((c) => (
          <article key={c.id} className="card">
            <div className="flex items-center justify-between"><h3 className="font-bold">{c.title}</h3>{c.verified && <span className="text-xs font-semibold text-[var(--green)]">상인 인증 완료 ✓</span>}</div>
            <dl className="mt-3 grid grid-cols-[64px_1fr] gap-y-1.5 text-sm">
              <dt className="sub">역할</dt><dd>{c.roleLabel}</dd>
              <dt className="sub">작업</dt><dd><ul className="list-disc pl-4">{c.tasks.map((t) => <li key={t}>{t}</li>)}</ul></dd>
              <dt className="sub">기간</dt><dd>{c.durationDays}일</dd>
              <dt className="sub">평가</dt><dd>{"★".repeat(c.rating)}{"☆".repeat(5 - c.rating)}</dd>
            </dl>
          </article>
        ))}
      </section>
    </>
  );
}
