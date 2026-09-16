"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@/types";
import { repo } from "./repo";

/** 로그인 대신 쓰는 임시 세션: 학생/주민 계정을 골라 화면을 본다. 실제 인증을 붙이면 이 파일만 바꾼다. */
interface Session { user: User | null; users: User[]; setUserId: (id: string) => void }
const Ctx = createContext<Session>({ user: null, users: [], setUserId: () => {} });

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [id, setId] = useState<string>("s1");
  useEffect(() => { repo.listUsers().then(setUsers); try { const s = localStorage.getItem("wolgye-user"); if (s) setId(s); } catch {} }, []);
  const setUserId = (v: string) => { setId(v); try { localStorage.setItem("wolgye-user", v); } catch {} };
  return <Ctx.Provider value={{ user: users.find((u) => u.id === id) ?? null, users, setUserId }}>{children}</Ctx.Provider>;
}
export const useSession = () => useContext(Ctx);
