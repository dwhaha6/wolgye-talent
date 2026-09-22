// 공고 초안 AI (Supabase Edge Function, Deno).
// 사장님이 대충 적은 고민 → Gemini 가 필요한 재능·추천 학과·결과물·기간을 유추해 PostDraft JSON 으로 돌려준다.
// Gemini 키는 여기(서버)에만 둔다: `npx supabase secrets set GEMINI_API_KEY=...`
// 배포: `npx supabase functions deploy draft-post`

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash"; // 무료 등급 모델. 바꾸려면 secrets 에 GEMINI_MODEL 설정

const CATEGORIES = ["디자인", "영상", "사진", "SNS홍보", "웹/앱", "디지털도움", "기타"];

const PROMPT = `너는 서울 노원구 월계1동의 주민·상인과 광운대학교 학생을 잇는 재능기부 플랫폼의 공고 작성 도우미다.
사장님(또는 주민)은 가게의 문제는 알지만 어떤 재능, 어느 학과 학생이 필요한지는 잘 모른다.
사장님이 대충 적은 글을 읽고 학생들이 바로 지원할 수 있는 공고 초안을 만든다.

- title: 학생이 한눈에 알 수 있는 짧은 제목. 필요한 작업이 여러 개면 " + " 로 잇는다. (예: "메뉴판 디자인 + QR 메뉴판 제작")
- category: 가장 핵심인 재능 하나. 반드시 ${CATEGORIES.join(", ")} 중 하나.
- teamSlots: 필요한 재능별 인원. 서로 다른 재능이 2가지 이상 필요하면 각각 넣고, 하나면 그 하나만 넣는다. category 는 위 목록 중 하나.
- deliverables: 학생이 넘겨줄 구체적인 결과물. 글에 나온 수량(메뉴 20개 등)은 반영한다.
- departments: 이 일을 잘할 만한 광운대 학과 1~3개 (예: 소프트웨어학부, 컴퓨터정보공학부, 미디어커뮤니케이션학부, 경영학부 등). 전공이 상관없으면 "전공 무관".
- durationDays: 대학생이 수업과 병행해 끝낼 수 있는 현실적인 기간(일).
- difficulty: 1 쉬움, 2 보통, 3 어려움.
- reward: 글에 보상(사례비, 식사권 등)이 있으면 그대로, 없으면 빈 문자열.
- description: 사장님 글을 바탕으로 학생에게 보여 줄 공고 본문. 상황, 원하는 결과물, 가능한 시간 등을 존댓말로 3~6문장. 글에 없는 사실은 지어내지 않는다.
- reasons: 왜 이런 재능·학과를 제안했는지 사장님이 이해할 수 있는 짧은 문장 1~3개.`;

const SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    category: { type: "STRING", enum: CATEGORIES },
    description: { type: "STRING" },
    deliverables: { type: "ARRAY", items: { type: "STRING" } },
    departments: { type: "ARRAY", items: { type: "STRING" } },
    durationDays: { type: "INTEGER" },
    difficulty: { type: "INTEGER" },
    teamSlots: { type: "ARRAY", items: { type: "OBJECT", properties: { category: { type: "STRING", enum: CATEGORIES }, count: { type: "INTEGER" } }, required: ["category", "count"] } },
    reward: { type: "STRING" },
    reasons: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["title", "category", "description", "deliverables", "departments", "durationDays", "difficulty", "teamSlots", "reward", "reasons"],
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!GEMINI_API_KEY) return json({ error: "서버에 GEMINI_API_KEY 가 설정되지 않았어요" }, 500);

  const { text } = await req.json().catch(() => ({ text: "" }));
  if (typeof text !== "string" || !text.trim()) return json({ error: "내용을 적어 주세요" }, 400);
  if (text.length > 2000) return json({ error: "2000자 이내로 적어 주세요" }, 400);

  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: PROMPT }] },
      contents: [{ role: "user", parts: [{ text }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: SCHEMA },
    }),
  });
  if (!r.ok) {
    console.error("gemini", r.status, await r.text());
    return json({ error: r.status === 429 ? "AI 사용량이 많아요. 잠시 후 다시 시도해 주세요" : "AI 초안을 만들지 못했어요" }, 502);
  }

  try {
    const data = await r.json();
    const d = JSON.parse(data.candidates[0].content.parts[0].text);
    // 모델 출력을 앱의 PostDraft 형태로 정리
    const slots = (d.teamSlots ?? []).filter((s: { category: string }) => CATEGORIES.includes(s.category))
      .map((s: { category: string; count: number }) => ({ category: s.category, count: Math.max(1, Math.min(5, s.count || 1)), filled: [] }));
    const isTeam = slots.length >= 2;
    return json({
      title: String(d.title).slice(0, 60),
      category: CATEGORIES.includes(d.category) ? d.category : "기타",
      description: d.description,
      deliverables: d.deliverables ?? [],
      departments: d.departments ?? [],
      durationDays: Math.max(1, Math.min(90, d.durationDays || 7)),
      difficulty: Math.max(1, Math.min(3, d.difficulty || 2)),
      isTeam,
      teamSlots: isTeam ? slots : undefined,
      reward: d.reward || undefined,
      reasons: d.reasons ?? [],
    });
  } catch (e) {
    console.error("parse", e);
    return json({ error: "AI 답변을 읽지 못했어요. 다시 시도해 주세요" }, 502);
  }
});
