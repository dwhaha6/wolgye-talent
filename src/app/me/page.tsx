"use client";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { useSession } from "@/lib/session";

/** 내 정보 + 계정 전환(임시 로그인). 학생 프로필 항목: 학과·기술·관심·시간·거리 */
export default function Me() {
  const { user, users, setUserId } = useSession();
  return (
    <>
      <TopBar title="나" />
      <section className="flex flex-col gap-3 px-4">
        <div className="card">
          <p className="sub text-xs">지금 보는 계정</p>
          <select className="mt-1 w-full rounded-xl bg-[var(--line)] p-3 text-[15px]" value={user?.id ?? ""} onChange={(e) => setUserId(e.target.value)}>
            <optgroup label="학생">{users.filter((u) => u.role === "student").map((u) => <option key={u.id} value={u.id}>{u.name} · {(u as { department: string }).department}</option>)}</optgroup>
            <optgroup label="주민·상인">{users.filter((u) => u.role === "resident").map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</optgroup>
          </select>
          <p className="sub mt-2 text-xs">실제 로그인 대신 계정을 골라 화면을 확인합니다. 인증을 붙일 자리: src/lib/session.tsx</p>
        </div>
        {user?.role === "student" && (
          <div className="card text-sm">
            <h3 className="mb-2 font-bold">{user.name}</h3>
            <dl className="grid grid-cols-[92px_1fr] gap-y-1.5">
              <dt className="sub">학과</dt><dd>{user.department}</dd>
              <dt className="sub">보유 기술</dt><dd>{user.skills.join(", ")}</dd>
              <dt className="sub">관심 분야</dt><dd>{user.interests.join(", ")}</dd>
              <dt className="sub">가능 시간</dt><dd>{user.availableHours}</dd>
              <dt className="sub">가능 거리</dt><dd>{user.maxDistanceM}m</dd>
            </dl>
          </div>
        )}
        {user?.role === "resident" && <div className="card text-sm"><h3 className="font-bold">{user.name}</h3><p className="sub mt-1">{user.kind} · {user.address}</p></div>}
        <ul className="card flex flex-col divide-y divide-[var(--line)] p-0 text-[15px]">
          {[["/portfolio", "📁 내 포트폴리오"], ["/teams", "👥 팀 프로젝트"], ["/notifications", "🔔 알림"], ["/posts/new", "➕ 공고 등록 (주민·상인)"]].map(([h, l]) => (
            <li key={h}><Link href={h} className="flex items-center justify-between px-4 py-3.5">{l}<span className="sub">›</span></Link></li>
          ))}
        </ul>
      </section>
    </>
  );
}
