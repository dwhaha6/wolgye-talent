import type { Category, RoleSlot } from "@/types";

/**
 * 사장님이 대충 적은 고민 → 공고 초안.
 * 사장님은 문제는 알아도 "무슨 재능(어느 과)이 필요한지"는 모르는 경우가 많아서, 필요한 재능·결과물·기간을 유추해 채워 준다.
 * 초안은 등록 폼을 미리 채울 뿐이고, 사장님이 확인·수정한 뒤 등록한다.
 */
export interface PostDraft {
  title: string;
  category: Category;          // 대표 카테고리
  description: string;
  deliverables: string[];      // 결과물
  departments: string[];       // 추천 학과
  durationDays: number;
  difficulty: 1 | 2 | 3;
  isTeam: boolean;
  teamSlots?: RoleSlot[];
  reward?: string;
  reasons: string[];           // 왜 이렇게 판단했는지 (사장님에게 보여 준다)
}

export interface PostDrafter { draft(text: string): Promise<PostDraft> }

// ── 규칙 기반 구현 (API 키 없이 동작) ─────────────────────────────────────────
interface Need { keys: string[]; category: Category; title: string; deliverable: string; days: number; difficulty: 1 | 2 | 3 }

// 위에서부터 매칭. 같은 카테고리가 여러 번 걸려도 결과물은 모두 모은다.
const NEEDS: Need[] = [
  { keys: ["메뉴판"], category: "디자인", title: "메뉴판 디자인", deliverable: "인쇄용 메뉴판 파일", days: 7, difficulty: 2 },
  { keys: ["qr", "큐알", "폰으로 메뉴", "모바일 메뉴"], category: "웹/앱", title: "QR 메뉴판 제작", deliverable: "QR 로 열리는 웹 메뉴판", days: 10, difficulty: 2 },
  { keys: ["홈페이지", "웹사이트", "사이트", "예약", "주문 페이지"], category: "웹/앱", title: "가게 웹페이지 제작", deliverable: "가게 소개·예약 웹페이지", days: 14, difficulty: 3 },
  { keys: ["포스터", "전단", "현수막"], category: "디자인", title: "홍보 포스터 디자인", deliverable: "인쇄용 포스터·전단 파일", days: 7, difficulty: 2 },
  { keys: ["간판", "로고", "브랜딩"], category: "디자인", title: "간판·로고 디자인", deliverable: "로고·간판 시안 파일", days: 10, difficulty: 2 },
  { keys: ["영상", "유튜브", "릴스", "숏폼", "쇼츠"], category: "영상", title: "가게 홍보 영상", deliverable: "30초 내외 숏폼 영상 1편", days: 14, difficulty: 2 },
  { keys: ["사진", "촬영", "플레이스"], category: "사진", title: "가게·메뉴 사진 촬영", deliverable: "가게·메뉴 사진 20장", days: 3, difficulty: 1 },
  { keys: ["인스타", "sns", "홍보", "손님이 없", "손님이 줄", "장사가 안", "리뷰", "알리고"], category: "SNS홍보", title: "SNS 홍보", deliverable: "인스타 게시물 6개 + 해시태그 정리", days: 14, difficulty: 2 },
  { keys: ["키오스크", "스마트폰", "핸드폰", "휴대폰", "카톡", "카카오톡", "어르신", "배달앱"], category: "디지털도움", title: "디지털 기기 사용 도움", deliverable: "사용법 교육 4회 (주 1회 1시간)", days: 28, difficulty: 1 },
];

const DEPARTMENTS: Record<Category, string[]> = {
  "디자인": ["디자인학과"],
  "웹/앱": ["소프트웨어학부", "컴퓨터정보공학부"],
  "영상": ["미디어영상학부"],
  "사진": ["미디어영상학부"],
  "SNS홍보": ["경영학부", "미디어커뮤니케이션학부"],
  "디지털도움": ["전공 무관"],
  "기타": ["전공 무관"],
};

export const ruleDrafter: PostDrafter = {
  async draft(text) {
    const src = text.trim();
    const low = src.toLowerCase();
    const hits = NEEDS.filter((n) => n.keys.some((k) => low.includes(k)));
    const reasons = hits.map((n) => `"${n.keys.find((k) => low.includes(k))!.toUpperCase()}" → ${n.category} 재능이 필요해 보여요`);

    // "메뉴 20개", "사진 30장" 같은 수량은 결과물에 그대로 붙인다
    const qty = src.match(/(메뉴|사진|게시물)\s*(\d+)\s*(개|장)/);
    const qtyCat: Record<string, Category> = { "메뉴": "웹/앱", "사진": "사진", "게시물": "SNS홍보" };
    const deliverables = hits.map((n) => (qty && qtyCat[qty[1]] === n.category ? `${n.deliverable} (${qty[0]})` : n.deliverable));

    const cats = Array.from(new Set(hits.map((n) => n.category)));
    const isTeam = cats.length >= 2;
    if (isTeam) reasons.push(`서로 다른 재능 ${cats.length}가지가 필요해 팀 공고로 제안해요`);

    const maxDays = Math.max(7, ...hits.map((n) => n.days));
    const durationDays = isTeam ? Math.ceil((maxDays + 3) / 7) * 7 : maxDays; // 팀은 조율 시간을 더해 주 단위로
    const difficulty = (hits.length ? Math.max(...hits.map((n) => n.difficulty)) : 2) as 1 | 2 | 3;

    const money = src.match(/(\d+)\s*만\s*원/);
    const reward = money ? `사례비 ${money[1]}만원` : undefined;

    const category = cats[0] ?? "기타";
    const title = hits.length ? Array.from(new Set(hits.map((n) => n.title))).slice(0, 3).join(" + ") : src.split(/[.\n!?]/)[0].slice(0, 24) || "도움이 필요해요";
    const departments = Array.from(new Set(cats.flatMap((c) => DEPARTMENTS[c]).concat(cats.length ? [] : DEPARTMENTS["기타"])));

    const description = [
      src,
      deliverables.length ? `[원하는 결과물]\n${deliverables.map((d) => `- ${d}`).join("\n")}` : "",
      `[이런 분을 찾아요] ${departments.join(", ")}`,
    ].filter(Boolean).join("\n\n");

    return {
      title, category, description, deliverables, departments, durationDays, difficulty, isTeam, reward, reasons,
      teamSlots: isTeam ? cats.map((c) => ({ category: c, count: 1, filled: [] })) : undefined,
    };
  },
};

// ── 원격 AI 구현 ─────────────────────────────────────────────────────────────
// 앱은 정적 빌드 + public 저장소라 AI API 키를 앱에 넣을 수 없다. 키를 가진 서버(예: Supabase Edge Function)를 만들고
// NEXT_PUBLIC_AI_DRAFT_URL 에 주소를 넣으면 그 서버가 { text } 를 받아 PostDraft JSON 을 돌려준다. 실패하면 규칙 기반으로 대신한다.
const remoteDrafter = (url: string): PostDrafter => ({
  async draft(text) {
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      if (!r.ok) throw new Error(String(r.status));
      return (await r.json()) as PostDraft;
    } catch {
      return ruleDrafter.draft(text);
    }
  },
});

const AI_URL = process.env.NEXT_PUBLIC_AI_DRAFT_URL;
export const drafter: PostDrafter = AI_URL ? remoteDrafter(AI_URL) : ruleDrafter; // ← AI 교체 지점
