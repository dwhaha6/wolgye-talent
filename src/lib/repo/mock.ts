import type { Application, Notification, Post, PortfolioCard, RankRow, Review, User } from "@/types";
import type { Repo } from "./index";
import { distanceM } from "../geo";

// ── 시드 데이터 (월계1동 근방 좌표) ──────────────────────────────────────────
const users: User[] = [
  { id: "s1", role: "student", name: "김하늘", department: "디자인학과", skills: ["포스터", "일러스트", "Figma"], interests: ["디자인", "SNS홍보"], availableHours: "평일 저녁, 주말", maxDistanceM: 1500, location: { lat: 37.6196, lng: 127.0592 } },
  { id: "s2", role: "student", name: "박도윤", department: "소프트웨어학부", skills: ["React", "웹페이지", "QR"], interests: ["웹/앱", "디지털도움"], availableHours: "주말", maxDistanceM: 2000, location: { lat: 37.6210, lng: 127.0620 } },
  { id: "s3", role: "student", name: "이서준", department: "미디어영상학부", skills: ["숏폼", "프리미어", "촬영"], interests: ["영상", "사진"], availableHours: "평일 오후", maxDistanceM: 1200, location: { lat: 37.6230, lng: 127.0580 } },
  { id: "s4", role: "student", name: "최지우", department: "경영학부", skills: ["인스타그램", "카피", "마케팅"], interests: ["SNS홍보", "기타"], availableHours: "평일 저녁", maxDistanceM: 1000, location: { lat: 37.6250, lng: 127.0610 } },
  { id: "r1", role: "resident", name: "월계 커피", kind: "상인", location: { lat: 37.6248, lng: 127.0598 }, address: "월계로 45길 12" },
  { id: "r2", role: "resident", name: "행복분식", kind: "상인", location: { lat: 37.6272, lng: 127.0615 }, address: "월계1동 광운로 21" },
  { id: "r3", role: "resident", name: "동네책방 소소", kind: "상인", location: { lat: 37.6285, lng: 127.0580 }, address: "석계로 7" },
  { id: "r4", role: "resident", name: "정순자 님", kind: "주민", location: { lat: 37.6238, lng: 127.0632 }, address: "월계1동 주민센터 인근" },
  { id: "r5", role: "resident", name: "삼거리 정육점", kind: "상인", location: { lat: 37.6302, lng: 127.0622 }, address: "월계로 60" },
];

const posts: Post[] = [
  { id: "p1", title: "카페 신메뉴 포스터 디자인", category: "디자인", description: "가을 신메뉴 3종 포스터(A3) 1장과 인스타용 정사각 이미지 3장이 필요해요. 사진은 저희가 드립니다.", authorId: "r1", location: users[4].location, address: "월계로 45길 12", status: "open", reward: "음료 쿠폰 10장 + 사례비 5만원", durationDays: 7, difficulty: 2, isTeam: false, createdAt: "2026-09-14T09:00:00Z" },
  { id: "p2", title: "QR 메뉴판 만들어 주실 분", category: "웹/앱", description: "종이 메뉴판을 QR 로 볼 수 있게 간단한 웹 메뉴판을 만들고 싶어요. 메뉴 20개 정도.", authorId: "r2", location: users[5].location, address: "광운로 21", status: "open", reward: "식사권 5장", durationDays: 10, difficulty: 2, isTeam: false, createdAt: "2026-09-15T02:00:00Z" },
  { id: "p3", title: "책방 소개 숏폼 영상 1편", category: "영상", description: "30초 내외 릴스 영상. 책방 분위기와 이달의 책 소개. 촬영은 평일 오후 가능.", authorId: "r3", location: users[6].location, address: "석계로 7", status: "in_progress", reward: "도서 2권", durationDays: 14, difficulty: 2, isTeam: false, createdAt: "2026-09-10T05:00:00Z" },
  { id: "p4", title: "키오스크·스마트폰 사용 도움", category: "디지털도움", description: "주민센터 근처 어르신 5분께 키오스크 주문, 카카오톡 사진 보내기 등을 알려드릴 분. 주 1회 1시간, 4주.", authorId: "r4", location: users[7].location, address: "월계1동 주민센터", status: "open", durationDays: 28, difficulty: 1, isTeam: false, createdAt: "2026-09-13T01:00:00Z" },
  { id: "p5", title: "정육점 디지털 개선 프로젝트 (팀)", category: "웹/앱", description: "간판·메뉴판 디자인 새로 하고, 홍보 영상 1편, 네이버 예약/주문 페이지 연결까지. 팀으로 진행해요.", authorId: "r5", location: users[8].location, address: "월계로 60", status: "open", reward: "팀 사례비 30만원", durationDays: 21, difficulty: 3, isTeam: true, teamSlots: [{ category: "디자인", count: 1, filled: [] }, { category: "영상", count: 1, filled: ["s3"] }, { category: "웹/앱", count: 1, filled: [] }], createdAt: "2026-09-12T07:00:00Z" },
  { id: "p6", title: "인스타그램 계정 운영 도움 (2주)", category: "SNS홍보", description: "게시물 6개 기획·제작과 해시태그 정리. 사진은 함께 찍어요.", authorId: "r1", location: users[4].location, address: "월계로 45길 12", status: "done", reward: "사례비 8만원", durationDays: 14, difficulty: 2, isTeam: false, createdAt: "2026-08-20T09:00:00Z" },
  { id: "p7", title: "가게 외관·메뉴 사진 촬영", category: "사진", description: "네이버 플레이스에 올릴 사진 20장. 1시간 정도 촬영.", authorId: "r2", location: users[5].location, address: "광운로 21", status: "done", reward: "식사 제공", durationDays: 3, difficulty: 1, isTeam: false, createdAt: "2026-08-28T03:00:00Z" },
];

const applications: Application[] = [
  { id: "a1", postId: "p3", studentId: "s3", message: "숏폼 편집 경험 있습니다. 평일 오후 가능해요.", status: "accepted", createdAt: "2026-09-10T08:00:00Z" },
  { id: "a2", postId: "p1", studentId: "s1", message: "포스터 3종 시안 드릴 수 있어요.", status: "pending", createdAt: "2026-09-14T12:00:00Z" },
];

const reviews: Review[] = [
  { postId: "p6", studentId: "s4", rating: 5, comment: "게시물 반응이 정말 좋아졌어요.", verified: true },
  { postId: "p7", studentId: "s3", rating: 5, comment: "사진이 깔끔하고 빨랐어요.", verified: true },
];

const portfolio: PortfolioCard[] = [
  { id: "c1", studentId: "s4", postId: "p6", title: "월계 커피 홍보 프로젝트", roleLabel: "SNS 콘텐츠 기획·디자인", tasks: ["홍보 게시물 6개 제작", "해시태그·업로드 일정 정리"], durationDays: 14, rating: 5, verified: true },
  { id: "c2", studentId: "s3", postId: "p7", title: "행복분식 사진 촬영", roleLabel: "촬영·보정", tasks: ["외관·메뉴 사진 20장 촬영", "네이버 플레이스용 보정"], durationDays: 3, rating: 5, verified: true },
];

const notifications: Notification[] = [
  { id: "n1", userId: "s1", postId: "p1", text: "월계 커피에서 '카페 신메뉴 포스터 디자인' 프로젝트가 등록되었습니다.", distanceM: 580, read: false, createdAt: "2026-09-14T09:01:00Z" },
  { id: "n2", userId: "s1", postId: "p5", text: "삼거리 정육점 팀 프로젝트에 디자인 1명이 필요합니다.", distanceM: 1200, read: true, createdAt: "2026-09-12T07:05:00Z" },
  { id: "n3", userId: "r1", postId: "p1", text: "김하늘 학생이 포스터 공고에 지원했습니다.", read: false, createdAt: "2026-09-14T12:00:00Z" },
];

// ── 브라우저 새로고침 사이에만 유지되는 간단한 저장(localStorage). 서버 연결 전 임시. ──
const KEY = "wolgye-mock-v1";
function load() {
  if (typeof window === "undefined") return;
  try { const s = localStorage.getItem(KEY); if (s) { const d = JSON.parse(s); posts.splice(0, posts.length, ...d.posts); applications.splice(0, applications.length, ...d.applications); } } catch {}
}
function save() {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify({ posts, applications })); } catch {}
}
let loaded = false; const ensure = () => { if (!loaded) { load(); loaded = true; } };
const wait = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 80));

export const mockRepo: Repo = {
  async listUsers() { return wait(users); },
  async getUser(id) { return wait(users.find((u) => u.id === id)); },
  async listPosts() { ensure(); return wait([...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt))); },
  async getPost(id) { ensure(); return wait(posts.find((p) => p.id === id)); },
  async createPost(p) { ensure(); const post: Post = { ...p, id: `p${Date.now()}`, status: "open", createdAt: new Date().toISOString() }; posts.unshift(post); save(); return wait(post); },
  async updatePostStatus(id, status) { ensure(); const p = posts.find((x) => x.id === id); if (p) p.status = status; save(); },
  async listApplications(postId) { ensure(); return wait(applications.filter((a) => !postId || a.postId === postId)); },
  async apply(postId, studentId, message) { ensure(); const a: Application = { id: `a${Date.now()}`, postId, studentId, message, status: "pending", createdAt: new Date().toISOString() }; applications.push(a); save(); return wait(a); },
  async listReviews(studentId) { return wait(reviews.filter((r) => !studentId || r.studentId === studentId)); },
  async listPortfolio(studentId) { return wait(portfolio.filter((c) => c.studentId === studentId)); },
  async listNotifications(userId) { return wait(notifications.filter((n) => n.userId === userId)); },
  async ranking(kind) {
    // 지역 기여 점수 = 해결 수×10 + 평가 평균×4 + 난이도 합×3 (임시 공식, 나중에 조정)
    const students = users.filter((u): u is Extract<User, { role: "student" }> => u.role === "student");
    const rows: RankRow[] = students.map((s) => {
      const cards = portfolio.filter((c) => c.studentId === s.id);
      const solvedPosts = cards.map((c) => posts.find((p) => p.id === c.postId)).filter(Boolean) as Post[];
      const avg = cards.length ? cards.reduce((a, c) => a + c.rating, 0) / cards.length : 0;
      const diff = solvedPosts.reduce((a, p) => a + p.difficulty, 0);
      return { id: s.id, label: s.name, sub: s.department, solved: cards.length, score: cards.length * 10 + Math.round(avg * 4) + diff * 3 };
    });
    if (kind === "individual") return wait(rows.sort((a, b) => b.score - a.score));
    if (kind === "department") {
      const by: Record<string, RankRow> = {};
      for (const r of rows) { const k = r.sub; by[k] ??= { id: k, label: k, sub: "학과", score: 0, solved: 0 }; by[k].score += r.score; by[k].solved += r.solved; }
      return wait(Object.values(by).sort((a, b) => b.score - a.score));
    }
    return wait([{ id: "t1", label: "정육점 디지털 개선팀", sub: "디자인·영상·개발", score: 0, solved: 0 }]);
  },
};

export { distanceM };
