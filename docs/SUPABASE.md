# Supabase 연결 (로그인·DB·채팅·AI 초안)

`.env.local` 이 없으면 앱은 가짜 데이터 + 계정 전환 모드로 돈다. 아래를 한 번 하면 실제 로그인, 폰끼리 지원·채팅, Gemini 공고 초안이 동작한다.

## 1. 프로젝트 만들기
1. https://supabase.com 가입 → New project (무료 플랜, 지역은 Northeast Asia (Seoul))
2. **Authentication → Sign In / Providers → Email** 에서 *Confirm email* 을 끈다 (해커톤용: 가입 즉시 로그인)

## 2. DB 만들기
**SQL Editor** 에 [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql) 전체를 붙여 넣고 Run.

## 3. 앱에 연결
**Project Settings → API** 에서 Project URL 과 publishable(anon) 키를 복사해 `.env.local` 을 만든다.

```bash
cp .env.example .env.local   # 두 줄 채우기
npm run dev
```

이 키는 앱에 들어가도 되는 공개 키다. `service_role`/secret 키는 절대 넣지 않는다.
APK 자동 빌드에도 쓰려면 GitHub 저장소 **Settings → Secrets and variables → Actions → Variables** 에 같은 이름으로 두 값을 넣는다.

## 4. AI 공고 초안 (Gemini, 무료)
1. https://aistudio.google.com/apikey 에서 API 키 발급 (무료 등급은 입력이 구글 모델 개선에 쓰일 수 있음)
2. 함수 배포 — 둘 중 편한 쪽
   - **대시보드:** Edge Functions → Deploy a new function → 이름 `draft-post` → [`supabase/functions/draft-post/index.ts`](../supabase/functions/draft-post/index.ts) 내용 붙여 넣기 → Deploy.
     Edge Functions → Secrets 에 `GEMINI_API_KEY` 추가.
   - **CLI:**
     ```bash
     npx supabase login
     npx supabase secrets set GEMINI_API_KEY=발급받은키 --project-ref <프로젝트ref>
     npx supabase functions deploy draft-post --project-ref <프로젝트ref>
     ```
모델을 바꾸려면 secret `GEMINI_MODEL` 을 설정한다 (기본 `gemini-2.5-flash`).

## 구조 메모
- 테이블: profiles(auth.users 1:1), posts, applications, messages, reviews, portfolio_cards, notifications
- 권한(RLS): 지원서·채팅은 지원한 학생과 공고 작성자만 읽고 쓴다. 공고는 주민·상인만, 지원은 학생만.
- 채팅방 = 지원서 하나. 새 메시지는 Supabase Realtime 으로 바로 뜬다.
