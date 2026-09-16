import type { PostStatus } from "@/types";
export const STATUS: Record<PostStatus, { label: string; color: string; dot: string }> = {
  open: { label: "모집 중", color: "text-[var(--red)] bg-red-50", dot: "🔴" },
  in_progress: { label: "진행 중", color: "text-[#b47a00] bg-yellow-50", dot: "🟡" },
  done: { label: "해결 완료", color: "text-[#1a8f4b] bg-green-50", dot: "🟢" },
};
export default function StatusBadge({ status }: { status: PostStatus }) {
  const s = STATUS[status];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.color}`}>{s.label}</span>;
}
