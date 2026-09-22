-- 월계 재능나눔 초기 스키마. Supabase 대시보드 → SQL Editor 에 붙여 넣고 실행하거나 `npx supabase db push`.
-- 컬럼은 src/types/index.ts 의 타입을 snake_case 로 옮긴 것이다.

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('student', 'resident')),
  name text not null,
  -- 학생
  department text,
  skills text[] not null default '{}',
  interests text[] not null default '{}',
  available_hours text,
  max_distance_m int not null default 1500,
  -- 주민·상인
  kind text check (kind in ('상인', '주민')),
  address text,
  lat double precision not null default 37.6255,
  lng double precision not null default 127.0605,
  created_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  description text not null default '',
  author_id uuid not null references public.profiles on delete cascade,
  lat double precision not null,
  lng double precision not null,
  address text not null default '',
  status text not null default 'open' check (status in ('open', 'in_progress', 'done')),
  reward text,
  duration_days int not null default 7,
  difficulty int not null default 2 check (difficulty between 1 and 3),
  is_team boolean not null default false,
  team_slots jsonb,
  created_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts on delete cascade,
  student_id uuid not null references public.profiles on delete cascade,
  message text not null default '',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  unique (post_id, student_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications on delete cascade,
  sender_id uuid not null references public.profiles on delete cascade,
  body text not null check (length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index on public.messages (application_id, created_at);

-- 다음 단계(평가·포트폴리오·알림)에서 채운다. 화면은 지금도 읽기만 한다.
create table public.reviews (
  post_id uuid references public.posts on delete cascade,
  student_id uuid references public.profiles on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text not null default '',
  verified boolean not null default true,
  primary key (post_id, student_id)
);

create table public.portfolio_cards (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles on delete cascade,
  post_id uuid not null references public.posts on delete cascade,
  title text not null,
  role_label text not null,
  tasks text[] not null default '{}',
  duration_days int not null,
  rating int not null,
  verified boolean not null default true
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  post_id uuid references public.posts on delete cascade,
  text text not null,
  distance_m int,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── 권한(RLS) ────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.applications enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.portfolio_cards enable row level security;
alter table public.notifications enable row level security;

create policy "프로필은 로그인하면 누구나 본다" on public.profiles for select to authenticated using (true);
create policy "내 프로필만 만든다" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "내 프로필만 고친다" on public.profiles for update to authenticated using (id = auth.uid());

create policy "공고는 로그인하면 누구나 본다" on public.posts for select to authenticated using (true);
create policy "주민·상인만 내 이름으로 공고를 올린다" on public.posts for insert to authenticated
  with check (author_id = auth.uid() and exists (select 1 from public.profiles where id = auth.uid() and role = 'resident'));
create policy "공고 작성자만 공고를 고친다" on public.posts for update to authenticated using (author_id = auth.uid());

-- 지원서: 지원한 학생과 공고 작성자만 본다
create function public.is_post_author(p uuid) returns boolean language sql security definer stable set search_path = public
  as $$ select exists (select 1 from posts where id = p and author_id = auth.uid()) $$;
create policy "지원서는 당사자만 본다" on public.applications for select to authenticated
  using (student_id = auth.uid() or public.is_post_author(post_id));
create policy "학생만 내 이름으로 지원한다" on public.applications for insert to authenticated
  with check (student_id = auth.uid() and exists (select 1 from public.profiles where id = auth.uid() and role = 'student'));
create policy "공고 작성자가 수락·거절한다" on public.applications for update to authenticated using (public.is_post_author(post_id));

-- 채팅: 지원서의 두 당사자만 읽고 쓴다
create function public.is_application_member(a uuid) returns boolean language sql security definer stable set search_path = public
  as $$ select exists (select 1 from applications ap join posts p on p.id = ap.post_id
                       where ap.id = a and (ap.student_id = auth.uid() or p.author_id = auth.uid())) $$;
create policy "채팅은 당사자만 본다" on public.messages for select to authenticated using (public.is_application_member(application_id));
create policy "채팅은 당사자만 보낸다" on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_application_member(application_id));

create policy "평가는 누구나 본다" on public.reviews for select to authenticated using (true);
create policy "공고 작성자가 평가한다" on public.reviews for insert to authenticated with check (public.is_post_author(post_id));
create policy "포트폴리오는 누구나 본다" on public.portfolio_cards for select to authenticated using (true);
create policy "알림은 본인만 본다" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "알림 읽음 처리는 본인만" on public.notifications for update to authenticated using (user_id = auth.uid());

-- 실시간 채팅
alter publication supabase_realtime add table public.messages;
