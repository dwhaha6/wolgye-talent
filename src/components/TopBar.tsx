"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TopBar({ title, back, right }: { title: string; back?: boolean; right?: React.ReactNode }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-[900] flex h-14 items-center justify-between bg-[var(--bg)]/95 px-4 backdrop-blur">
      <div className="flex items-center gap-2">
        {back && <button onClick={() => router.back()} aria-label="뒤로" className="-ml-1 p-1 text-xl">‹</button>}
        <h1 className="text-lg font-bold">{title}</h1>
      </div>
      <div className="flex items-center gap-3 text-sm">{right ?? <Link href="/notifications" aria-label="알림" className="text-xl">🔔</Link>}</div>
    </header>
  );
}
