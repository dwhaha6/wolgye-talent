# 설계 메모

## 데이터 흐름
주민·상인 공고 등록 → (추천 점수·거리) 학생 알림 → 개인/팀 지원 → 수행 → 주민·상인 평가·인증 → 포트폴리오 카드 + 기여 점수 + 랭킹

## 계층
- `types`: 모든 계층이 공유하는 계약. 서버 스키마도 이 타입을 기준으로 만든다.
- `repo`: 화면이 유일하게 의존하는 데이터 API. `mock.ts` 는 메모리+localStorage.
- `session`: 현재 사용자. 지금은 드롭다운으로 계정을 고른다.
- 화면: 상태를 거의 갖지 않고 repo 를 호출해 그린다.

## 백엔드 붙이기 (예: Supabase)
1. `types` 의 인터페이스대로 테이블을 만든다: users, posts, applications, reviews, portfolio_cards, notifications.
2. `src/lib/repo/supabase.ts` 에 `Repo` 를 구현한다 (함수 12개).
3. `src/lib/repo/index.ts` 의 `export const repo = mockRepo` 를 새 구현으로 바꾼다.
4. `session.tsx` 를 Supabase Auth 로 바꾼다. 화면 코드는 그대로.

## 지도 교체
`components/MapView.tsx` 만 카카오/네이버 SDK 로 다시 쓰면 된다. props(`posts`, `me`, `center`) 는 유지.

## 추천·알림 규칙
`recommend.ts` 의 점수(관심 40 + 학과 25 + 기술 15 + 거리 20)를 알림 조건에도 재사용한다.
예: 점수 ≥ 60 이고 거리 ≤ 활동 가능 거리면 알림.

## 랭킹 점수(임시)
해결 수×10 + 평가 평균×4 + 난이도 합×3. 실제 운영 전 가중치 재조정.

## 로드맵
1. 평가 입력 + 포트폴리오 자동 생성  2. 팀 역할 확정·팀 랭킹  3. 알림 생성 규칙 + 웹푸시
4. Supabase 연결 + 로그인(학교 이메일)  5. 공고 위치 지도 선택  6. 관리자(주민센터) 화면
