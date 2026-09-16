import type { Post, Student } from "@/types";
import { distanceM } from "./geo";

/** 학과 + 관심분야 + 보유기술 + 거리 기반 추천 점수 (0~100). 규칙은 단순하게 두고, 나중에 가중치·ML 로 교체 가능. */
export function recommendScore(student: Student, post: Post): number {
  let s = 0;
  if (student.interests.includes(post.category)) s += 40;
  const deptHit: Record<string, string[]> = {
    디자인: ["디자인", "시각", "산업"], 영상: ["미디어", "영상", "디자인"], 사진: ["미디어", "사진", "디자인"],
    SNS홍보: ["경영", "미디어", "광고"], "웹/앱": ["소프트웨어", "컴퓨터", "정보"], 디지털도움: ["소프트웨어", "컴퓨터", "정보", "경영"], 기타: [],
  };
  if ((deptHit[post.category] ?? []).some((k) => student.department.includes(k))) s += 25;
  const text = (post.title + post.description).toLowerCase();
  if (student.skills.some((k) => text.includes(k.toLowerCase()))) s += 15;
  const d = distanceM(student.location, post.location);
  if (d <= student.maxDistanceM) s += Math.round(20 * (1 - d / student.maxDistanceM));
  return Math.min(100, s);
}
