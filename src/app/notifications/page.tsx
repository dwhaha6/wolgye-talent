"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import EmptyState from "@/components/EmptyState";
import { repo } from "@/lib/repo";
import { useSession } from "@/lib/session";
import type { Notification } from "@/types";

/** ⑥ 알림: 관심 분야·거리에 맞는 새 공고, 내 공고의 지원자. 푸시 연동은 TODO. */
export default function Notifications() {
  const { user } = useSession();
  const [list, setList] = useState<Notification[]>([]);
  useEffect(() => { if (user) repo.listNotifications(user.id).then(setList); }, [user]);
  return (
    <>
      <TopBar title="알림" back right={<span />} />
      <section className="flex flex-col gap-2 px-4">
        {list.length === 0 && <EmptyState text="새 알림이 없어요" />}
        {list.map((n) => (
          <Link key={n.id} href={n.postId ? `/posts/detail?id=${n.postId}` : "#"} className={`card ${n.read ? "opacity-70" : ""}`}>
            {n.distanceM !== undefined && <p className="text-xs font-semibold text-[var(--primary)]">📍 {n.distanceM}m 거리</p>}
            <p className="mt-0.5 text-[15px]">{n.text}</p>
            <p className="sub mt-1 text-xs">{new Date(n.createdAt).toLocaleString("ko-KR")}</p>
          </Link>
        ))}
      </section>
    </>
  );
}
