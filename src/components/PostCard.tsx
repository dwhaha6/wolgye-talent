import Link from "next/link";
import type { Post } from "@/types";
import StatusBadge from "./StatusBadge";
import { formatDistance } from "@/lib/geo";

export default function PostCard({ post, authorName, distance, score }: { post: Post; authorName?: string; distance?: number; score?: number }) {
  return (
    <Link href={`/posts/detail?id=${post.id}`} className="card block active:opacity-80">
      <div className="mb-2 flex items-center justify-between">
        <span className="chip chip-on">{post.category}{post.isTeam ? " · 팀" : ""}</span>
        <StatusBadge status={post.status} />
      </div>
      <h3 className="text-[17px] font-bold leading-snug">{post.title}</h3>
      <p className="sub mt-1 line-clamp-2 text-sm">{post.description}</p>
      <div className="sub mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {authorName && <span>{authorName}</span>}
        {distance !== undefined && <span>📍 {formatDistance(distance)}</span>}
        <span>⏱ {post.durationDays}일</span>
        {post.reward && <span>🎁 {post.reward}</span>}
        {score !== undefined && <span className="ml-auto font-semibold text-[var(--primary)]">적합도 {score}%</span>}
      </div>
    </Link>
  );
}
