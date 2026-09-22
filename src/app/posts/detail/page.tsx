"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import TopBar from "@/components/TopBar";
import StatusBadge from "@/components/StatusBadge";
import { repo } from "@/lib/repo";
import { useSession } from "@/lib/session";
import { distanceM, formatDistance } from "@/lib/geo";
import type { Application, Post, User } from "@/types";

/** 공고 상세 + 지원(개인/팀 역할 선택) + 주민의 상태 변경·인증
 *  앱(정적 export) 빌드를 위해 /posts/[id] 대신 /posts/detail?id=... 형태를 쓴다. */
export default function PostDetailPage() {
  return <Suspense fallback={<TopBar title="공고" back />}><PostDetail /></Suspense>;
}

function PostDetail() {
  const id = useSearchParams().get("id") ?? "";
  const router = useRouter();
  const { user, users } = useSession();
  const [post, setPost] = useState<Post | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [msg, setMsg] = useState("");
  const reload = () => { repo.getPost(id).then((p) => setPost(p ?? null)); repo.listApplications(id).then(setApps); };
  useEffect(reload, [id]);
  if (!post) return <><TopBar title="공고" back /><p className="sub p-6 text-center text-sm">불러오는 중…</p></>;
  const author = users.find((u) => u.id === post.authorId) as Extract<User, { role: "resident" }> | undefined;
  const mine = apps.find((a) => a.studentId === user?.id);
  const isOwner = user?.id === post.authorId;

  async function submit() {
    if (!user || user.role !== "student") return;
    await repo.apply(post!.id, user.id, msg || "지원합니다!"); setMsg(""); reload();
  }
  async function setStatus(s: Post["status"]) { await repo.updatePostStatus(post!.id, s); reload(); }
  async function decide(a: Application, s: Application["status"]) {
    await repo.updateApplicationStatus(a.id, s);
    if (s === "accepted" && post!.status === "open" && !post!.isTeam) await repo.updatePostStatus(post!.id, "in_progress"); // 개인 공고는 수락하면 바로 진행 중
    reload();
  }

  return (
    <>
      <TopBar title="공고" back />
      <section className="flex flex-col gap-3 px-4">
        <div className="card">
          <div className="mb-2 flex items-center justify-between"><span className="chip chip-on">{post.category}{post.isTeam ? " · 팀 프로젝트" : ""}</span><StatusBadge status={post.status} /></div>
          <h2 className="text-xl font-bold">{post.title}</h2>
          <p className="sub mt-1 text-sm">{author?.name} · {post.address}{user && <> · 📍 {formatDistance(distanceM(user.location, post.location))}</>}</p>
          <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed">{post.description}</p>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-xl bg-[var(--line)] p-2"><dt className="sub text-xs">기간</dt><dd className="font-semibold">{post.durationDays}일</dd></div>
            <div className="rounded-xl bg-[var(--line)] p-2"><dt className="sub text-xs">난이도</dt><dd className="font-semibold">{"★".repeat(post.difficulty)}</dd></div>
            <div className="rounded-xl bg-[var(--line)] p-2"><dt className="sub text-xs">보상</dt><dd className="truncate font-semibold">{post.reward ?? "없음"}</dd></div>
          </dl>
        </div>

        {post.isTeam && post.teamSlots && (
          <div className="card">
            <h3 className="mb-2 font-bold">필요 인원</h3>
            <ul className="flex flex-col gap-2 text-sm">
              {post.teamSlots.map((s) => (
                <li key={s.category} className="flex items-center justify-between rounded-xl bg-[var(--line)] px-3 py-2">
                  <span>{s.category} {s.count}명</span>
                  <span className={s.filled.length >= s.count ? "text-[var(--green)]" : "sub"}>{s.filled.length}/{s.count} 확정{s.filled.map((f) => ` · ${users.find((u) => u.id === f)?.name ?? f}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {user?.role === "student" && (post.status === "open" || mine) && (
          <div className="card">
            <h3 className="mb-2 font-bold">{mine ? "지원 완료" : "지원하기"}</h3>
            {mine ? (
              <>
                <p className="sub text-sm">&ldquo;{mine.message}&rdquo; · {mine.status === "pending" ? "확인 대기 중" : mine.status === "accepted" ? "수락됨" : "거절됨"}</p>
                <Link href={`/chats/room?id=${mine.id}`} className="btn btn-primary mt-3 w-full">💬 {author?.name ?? "가게"}와 채팅하기</Link>
              </>
            ) : (
              <>
                <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="할 수 있는 것과 가능한 시간을 간단히 적어 주세요" className="h-24 w-full rounded-xl bg-[var(--line)] p-3 text-sm outline-none" />
                <button onClick={submit} className="btn btn-primary mt-3 w-full">지원하기</button>
              </>
            )}
          </div>
        )}

        {isOwner && (
          <div className="card">
            <h3 className="mb-2 font-bold">지원자 {apps.length}명</h3>
            <ul className="flex flex-col gap-2 text-sm">
              {apps.map((a) => { const s = users.find((u) => u.id === a.studentId) as Extract<User, { role: "student" }> | undefined; return (
                <li key={a.id} className="rounded-xl bg-[var(--line)] px-3 py-2">
                  <div className="flex items-center justify-between"><span><b>{s?.name}</b> <span className="sub">{s?.department}</span></span>
                    <span className={a.status === "accepted" ? "font-semibold text-[var(--primary)]" : "sub"}>{a.status === "pending" ? "대기" : a.status === "accepted" ? "수락" : "거절"}</span></div>
                  {s && s.skills.length > 0 && <p className="sub mt-0.5 text-xs">{s.skills.join(" · ")}</p>}
                  <p className="mt-1">{a.message}</p>
                  <div className="mt-2 grid grid-cols-3 gap-1.5 text-xs">
                    <Link href={`/chats/room?id=${a.id}`} className="btn bg-white px-2 py-2">💬 채팅</Link>
                    <button onClick={() => decide(a, "accepted")} disabled={a.status === "accepted"} className="btn btn-primary px-2 py-2 disabled:opacity-40">수락</button>
                    <button onClick={() => decide(a, "rejected")} disabled={a.status === "rejected"} className="btn bg-white px-2 py-2 disabled:opacity-40">거절</button>
                  </div>
                </li>); })}
              {apps.length === 0 && <li className="sub">아직 지원자가 없어요</li>}
            </ul>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <button onClick={() => setStatus("open")} className="btn btn-ghost">모집 중</button>
              <button onClick={() => setStatus("in_progress")} className="btn btn-ghost">진행 중</button>
              <button onClick={() => setStatus("done")} className="btn btn-primary">완료·인증</button>
            </div>
            <p className="sub mt-2 text-xs">완료·인증을 누르면 학생 포트폴리오에 활동 카드가 생기고 평가를 남길 수 있게 됩니다. (평가 화면은 TODO)</p>
          </div>
        )}
        <button onClick={() => router.push("/map")} className="btn btn-ghost w-full">지도에서 보기</button>
      </section>
    </>
  );
}
