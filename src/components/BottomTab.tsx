"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/map", label: "지도", icon: "🗺️" },
  { href: "/posts/new", label: "등록", icon: "➕" },
  { href: "/ranking", label: "랭킹", icon: "🏆" },
  { href: "/me", label: "나", icon: "👤" },
];

export default function BottomTab() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-1/2 z-[1000] w-full max-w-[480px] -translate-x-1/2 border-t border-[var(--line)] bg-white/95 backdrop-blur">
      <ul className="flex">
        {tabs.map((t) => {
          const on = t.href === "/" ? path === "/" : path.startsWith(t.href);
          return (
            <li key={t.href} className="flex-1">
              <Link href={t.href} className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] ${on ? "text-[var(--primary)] font-semibold" : "text-[var(--sub)]"}`}>
                <span className="text-xl leading-none">{t.icon}</span>{t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
