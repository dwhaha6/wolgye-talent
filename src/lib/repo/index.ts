import type { Application, Notification, Post, PortfolioCard, RankRow, Review, User } from "@/types";

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
  listReviews(studentId?: string): Promise<Review[]>;
  listPortfolio(studentId: string): Promise<PortfolioCard[]>;
  listNotifications(userId: string): Promise<Notification[]>;
  ranking(kind: "individual" | "team" | "department"): Promise<RankRow[]>;
}

import { mockRepo } from "./mock";
export const repo: Repo = mockRepo; // ← 백엔드 교체 지점
