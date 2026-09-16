"use client";
import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import PostCard from "@/components/PostCard";
import EmptyState from "@/components/EmptyState";
import { repo } from "@/lib/repo";
import { useSession } from "@/lib/session";
import type { Post } from "@/types";

/** ⑤ 팀 프로젝트 목록: 여러 역할이 필요한 공고만 모아 본다. 팀 채팅·역할 확정은 TODO. */
export default function Teams() {
  const { users } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  useEffect(() => { repo.listPosts().then((p) => setPosts(p.filter((x) => x.isTeam))); }, []);
  return (
    <>
      <TopBar title="팀 프로젝트" back />
      <section className="flex flex-col gap-3 px-4">
        {posts.length === 0 && <EmptyState text="팀 공고가 없어요" />}
        {posts.map((p) => <PostCard key={p.id} post={p} authorName={users.find((u) => u.id === p.authorId)?.name} />)}
      </section>
    </>
  );
}
