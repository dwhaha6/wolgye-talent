import type { Application, ChatMessage, ChatRoom, Notification, Post, PortfolioCard, RankRow, Review, User } from "@/types";

/**
 * 데이터 접근 계층(Repository). 화면은 이 인터페이스만 사용한다.
 * 지금은 mock 구현(메모리+localStorage)이고, 나중에 Supabase/REST 구현으로 교체하면 화면 코드는 그대로 둘 수 있다.
 */
export interface Repo {
  listUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  listPosts(): Promise<Post[]>;
  getPost(id: string): Promise<Post | undefined>;
  createPost(p: Omit<Post, "id" | "createdAt" | "status">): Promise<Post>;
  updatePostStatus(id: string, status: Post["status"]): Promise<void>;
  listApplications(postId?: string): Promise<Application[]>;
  apply(postId: string, studentId: string, message: string): Promise<Application>;
  getApplication(id: string): Promise<Application | undefined>;
  updateApplicationStatus(id: string, status: Application["status"]): Promise<void>; // 공고 작성자의 수락·거절
  // 채팅: 지원서 하나가 채팅방 하나 (공고 작성자 ↔ 지원 학생)
  listChatRooms(userId: string): Promise<ChatRoom[]>;
  listMessages(applicationId: string): Promise<ChatMessage[]>;
  sendMessage(applicationId: string, senderId: string, body: string): Promise<ChatMessage>;
  onMessage(applicationId: string, cb: (m: ChatMessage) => void): () => void; // 새 메시지 구독, 반환값으로 해제
  listReviews(studentId?: string): Promise<Review[]>;
  listPortfolio(studentId: string): Promise<PortfolioCard[]>;
  listNotifications(userId: string): Promise<Notification[]>;
  ranking(kind: "individual" | "team" | "department"): Promise<RankRow[]>;
}

import { mockRepo } from "./mock";
import { supabaseRepo } from "./supabase";
import { supabase } from "../supabase";

// .env.local 에 Supabase 주소·키가 있으면 실제 DB, 없으면 가짜 데이터(계정 전환으로 화면 확인)
export const repo: Repo = supabase ? supabaseRepo(supabase) : mockRepo; // ← 백엔드 교체 지점
