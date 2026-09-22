import type { SupabaseClient } from "@supabase/supabase-js";
import type { Application, ChatMessage, ChatRoom, Notification, Post, PortfolioCard, RankRow, Review, User } from "@/types";
import type { Repo } from "./index";

// ── DB 행(snake_case) ↔ 도메인 타입(camelCase) 변환 ────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

export const toUser = (r: Row): User => r.role === "student"
  ? { id: r.id, role: "student", name: r.name, department: r.department ?? "", skills: r.skills ?? [], interests: r.interests ?? [], availableHours: r.available_hours ?? "", maxDistanceM: r.max_distance_m, location: { lat: r.lat, lng: r.lng } }
  : { id: r.id, role: "resident", name: r.name, kind: r.kind ?? "주민", address: r.address ?? "", location: { lat: r.lat, lng: r.lng } };

const toPost = (r: Row): Post => ({
  id: r.id, title: r.title, category: r.category, description: r.description, authorId: r.author_id,
  location: { lat: r.lat, lng: r.lng }, address: r.address, status: r.status, reward: r.reward ?? undefined,
  durationDays: r.duration_days, difficulty: r.difficulty, isTeam: r.is_team, teamSlots: r.team_slots ?? undefined, createdAt: r.created_at,
});
const toApp = (r: Row): Application => ({ id: r.id, postId: r.post_id, studentId: r.student_id, message: r.message, status: r.status, createdAt: r.created_at });
const toMsg = (r: Row): ChatMessage => ({ id: r.id, applicationId: r.application_id, senderId: r.sender_id, body: r.body, createdAt: r.created_at });

/** 에러는 그대로 던져서 화면에서 알 수 있게 한다 */
// 타입 없는 클라이언트라 결과는 Row(any)로 받고, 위의 to* 함수가 도메인 타입으로 바꾼다
function ok({ data, error }: { data: any; error: { message: string } | null }): any {
  if (error || data === null) throw new Error(error?.message ?? "데이터가 없습니다");
  return data;
}
/** 결과 없이 쓰기만 하는 요청(update 등) */
function done({ error }: { error: { message: string } | null }) { if (error) throw new Error(error.message); }
/** 없을 수도 있는 한 건(maybeSingle) */
function maybe({ data, error }: { data: any; error: { message: string } | null }): Row | null {
  if (error) throw new Error(error.message);
  return data;
}

export function supabaseRepo(db: SupabaseClient): Repo {
  const repo: Repo = {
    async listUsers() { return ok(await db.from("profiles").select("*")).map(toUser); },
    async getUser(id) { const r = maybe(await db.from("profiles").select("*").eq("id", id).maybeSingle()); return r ? toUser(r) : undefined; },
    async listPosts() { return ok(await db.from("posts").select("*").order("created_at", { ascending: false })).map(toPost); },
    async getPost(id) { const r = maybe(await db.from("posts").select("*").eq("id", id).maybeSingle()); return r ? toPost(r) : undefined; },
    async createPost(p) {
      const r = ok(await db.from("posts").insert({
        title: p.title, category: p.category, description: p.description, author_id: p.authorId, lat: p.location.lat, lng: p.location.lng,
        address: p.address, reward: p.reward || null, duration_days: p.durationDays, difficulty: p.difficulty, is_team: p.isTeam, team_slots: p.teamSlots ?? null,
      }).select().single());
      return toPost(r);
    },
    async updatePostStatus(id, status) { done(await db.from("posts").update({ status }).eq("id", id)); },
    async listApplications(postId) {
      let q = db.from("applications").select("*").order("created_at");
      if (postId) q = q.eq("post_id", postId);
      return ok(await q).map(toApp);
    },
    async apply(postId, studentId, message) { return toApp(ok(await db.from("applications").insert({ post_id: postId, student_id: studentId, message }).select().single())); },
    async getApplication(id) { const r = maybe(await db.from("applications").select("*").eq("id", id).maybeSingle()); return r ? toApp(r) : undefined; },
    async updateApplicationStatus(id, status) { done(await db.from("applications").update({ status }).eq("id", id)); },

    async listChatRooms(userId) {
      // RLS 덕분에 내가 당사자인 지원서만 온다
      const rows = ok(await db.from("applications").select("*, post:posts(*), student:profiles(*), messages(id, application_id, sender_id, body, created_at)")
        .order("created_at", { referencedTable: "messages", ascending: false }).limit(1, { referencedTable: "messages" }));
      const rooms: ChatRoom[] = [];
      for (const r of rows) {
        const post = toPost(r.post);
        const other = r.student_id === userId ? await repo.getUser(post.authorId) : toUser(r.student);
        rooms.push({ application: toApp(r), post, other, last: r.messages?.[0] ? toMsg(r.messages[0]) : undefined });
      }
      const at = (x: ChatRoom) => x.last?.createdAt ?? x.application.createdAt;
      return rooms.sort((a, b) => at(b).localeCompare(at(a)));
    },
    async listMessages(applicationId) { return ok(await db.from("messages").select("*").eq("application_id", applicationId).order("created_at")).map(toMsg); },
    async sendMessage(applicationId, senderId, body) { return toMsg(ok(await db.from("messages").insert({ application_id: applicationId, sender_id: senderId, body }).select().single())); },
    onMessage(applicationId, cb) {
      const ch = db.channel(`messages:${applicationId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `application_id=eq.${applicationId}` }, (e) => cb(toMsg(e.new)))
        // 연결까지 몇 초 걸린다. 그 사이 온 메시지를 놓치지 않게 연결되면 한 번 다시 불러온다 (화면에서 id 로 중복 제거)
        .subscribe((status) => { if (status === "SUBSCRIBED") repo.listMessages(applicationId).then((ms) => ms.forEach(cb)); });
      return () => { db.removeChannel(ch); };
    },

    async listReviews(studentId) {
      let q = db.from("reviews").select("*");
      if (studentId) q = q.eq("student_id", studentId);
      return ok(await q).map((r: Row): Review => ({ postId: r.post_id, studentId: r.student_id, rating: r.rating, comment: r.comment, verified: r.verified }));
    },
    async listPortfolio(studentId) {
      return ok(await db.from("portfolio_cards").select("*").eq("student_id", studentId)).map((r: Row): PortfolioCard => ({
        id: r.id, studentId: r.student_id, postId: r.post_id, title: r.title, roleLabel: r.role_label, tasks: r.tasks, durationDays: r.duration_days, rating: r.rating, verified: r.verified,
      }));
    },
    async listNotifications(userId) {
      return ok(await db.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false })).map((r: Row): Notification => ({
        id: r.id, userId: r.user_id, postId: r.post_id ?? undefined, text: r.text, distanceM: r.distance_m ?? undefined, read: r.read, createdAt: r.created_at,
      }));
    },
    async ranking(kind) {
      // mock 과 같은 임시 공식: 해결 수×10 + 평가 평균×4 + 난이도 합×3
      const [users, cards, posts] = await Promise.all([repo.listUsers(), db.from("portfolio_cards").select("*").then(ok), repo.listPosts()]);
      const rows: RankRow[] = users.filter((u) => u.role === "student").map((s) => {
        const mine = (cards as Row[]).filter((c) => c.student_id === s.id);
        const avg = mine.length ? mine.reduce((a, c) => a + c.rating, 0) / mine.length : 0;
        const diff = mine.reduce((a, c) => a + (posts.find((p) => p.id === c.post_id)?.difficulty ?? 0), 0);
        return { id: s.id, label: s.name, sub: s.role === "student" ? s.department : "", solved: mine.length, score: mine.length * 10 + Math.round(avg * 4) + diff * 3 };
      });
      if (kind === "department") {
        const by: Record<string, RankRow> = {};
        for (const r of rows) { by[r.sub] ??= { id: r.sub, label: r.sub, sub: "학과", score: 0, solved: 0 }; by[r.sub].score += r.score; by[r.sub].solved += r.solved; }
        return Object.values(by).sort((a, b) => b.score - a.score);
      }
      if (kind === "team") return []; // 팀 랭킹은 팀 확정 기능 이후
      return rows.sort((a, b) => b.score - a.score);
    },
  };
  return repo;
}
