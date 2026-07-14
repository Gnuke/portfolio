# Research: 관리자 프로젝트 콘텐츠 관리 (Phase 0)

**Date**: 2026-07-13 | **Plan**: [plan.md](./plan.md)

Technical Context의 미확정 항목을 모두 해소했다. 실제 Supabase 프로젝트
(`onaormuhkjekmcezeccn`)를 MCP로 조회하여 확인한 사실: 테이블 0개,
마이그레이션 0개(빈 프로젝트), URL `https://onaormuhkjekmcezeccn.supabase.co`,
publishable key 발급됨(`sb_publishable_…`).

## R1. Supabase 클라이언트 연동 방식

- **Decision**: `@supabase/supabase-js` v2 단일 클라이언트를
  `src/lib/supabaseClient.ts` 싱글턴으로 생성. 접속 정보는
  `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` 환경 변수
  (`.env.local`, gitignore 대상)로 주입.
- **Rationale**: 공식 SDK가 Auth/DB/Storage를 모두 커버해 추가 의존성이
  필요 없다. publishable key는 클라이언트 노출용으로 설계된 키이며 RLS로
  권한이 통제된다.
- **Alternatives considered**: REST(PostgREST) 직접 호출 — 인증 토큰 관리를
  수동으로 해야 해서 기각. 레거시 anon JWT 키 — 신규 앱에는 publishable key
  권장(회전 독립성)이라 기각.

## R2. 관리자 페이지 분리 방식

- **Decision**: Vite 멀티 페이지(MPA) 두 번째 엔트리 `admin.html` +
  `src/admin/` 독립 트리. 방문자 앱에는 라우터를 도입하지 않는다.
- **Rationale**: FR-001(방문자 UI에 진입 요소 미노출)이 번들 수준에서
  보장된다 — 방문자 번들에 관리 코드가 아예 포함되지 않는다. 명세 001의
  "방문자 화면은 라우팅 없음" 원칙도 그대로 유지된다. 의존성 0개 추가.
- **Alternatives considered**: react-router 도입(방문자 앱과 코드 결합,
  의존성 추가 — YAGNI 위반으로 기각), 해시 라우팅 수동 구현(방문자 번들에
  관리 코드 포함되어 FR-001에 불리 — 기각).

## R3. 인증 및 계정 프로비저닝

- **Decision**: Supabase Auth 이메일/비밀번호 로그인. 관리자 계정 1개는
  Supabase 대시보드(Authentication → Users → Add user)에서 수동 생성.
  대시보드 설정에서 신규 가입(Sign-ups)을 비활성화. 세션은 supabase-js 기본
  (localStorage 보관, 자동 갱신) 사용 — 별도 만료 로직 없음(명세 Clarify 확정).
- **Rationale**: 회원가입 UI 금지(FR-003)와 제공자 기본 세션 정책(Clarify)을
  가장 단순하게 충족한다. 로그인 실패 시 supabase-js 오류를 일반 메시지로
  치환해 FR-004 충족.
- **Alternatives considered**: 커스텀 JWT/비밀번호 테이블(보안 리스크, YAGNI
  — 기각), 매직 링크(이메일 왕복이 필요해 UX 저하 — 기각).

## R4. 데이터베이스 스키마와 RLS

- **Decision**: `public` 스키마에 3개 테이블 — `projects`, `project_images`,
  `tech_stack`. 상태는 `status text CHECK (status IN
  ('current','completed','planned'))` (진행 중/완성/예정 매핑). 모든 테이블
  RLS 활성화: `SELECT`는 `anon`+`authenticated` 허용(방문자 공개 읽기),
  INSERT/UPDATE/DELETE는 `authenticated`만 허용(관리자 단일 계정).
  상세 계약은 [contracts/database.md](./contracts/database.md).
- **Rationale**: 관리자가 1명뿐이므로 authenticated == 관리자. 역할 테이블
  등 추가 권한 모델은 YAGNI.
- **Alternatives considered**: 예정 프로젝트 별도 테이블(상태 값 하나로
  통합 가능해 기각 — Clarify에서 "예정 상태로 통합" 확정), Edge Function
  경유 쓰기(서버 코드 추가 — 기각).

## R5. 이미지 저장과 정리

- **Decision**: Storage 버킷 `project-images` (public read). 버킷 생성 시
  `file_size_limit = 5MB`, `allowed_mime_types = image/png, image/jpeg,
  image/webp, image/gif`로 서버측 강제 + 클라이언트 선검증(즉시 안내).
  경로 규칙 `projects/{projectId}/{uuid}.{ext}`. 프로젝트 삭제 시
  `project_images` 행은 FK CASCADE로 제거하고, Storage 객체는 삭제 직전
  경로 목록을 조회해 함께 삭제(베스트 에포트 — 실패해도 삭제 흐름은 완료,
  잔여물은 경로 규칙 덕에 후속 정리 가능).
- **Rationale**: FR-013의 형식·용량 제한을 클라이언트+서버 이중으로 강제.
  공개 읽기 버킷이라 방문자 표시는 공개 URL로 충분(서명 URL 불필요).
- **Alternatives considered**: DB에 base64 저장(용량·성능 문제 — 기각),
  비공개 버킷+서명 URL(방문자 공개 콘텐츠에 불필요한 복잡성 — 기각).

## R6. 방문자 폴백 체인 (캐시 → 정적)

- **Decision**: `contentCache.ts`가 localStorage 키
  `oor-content-cache-v1`에 마지막 성공 로드 스냅샷(JSON) 저장.
  `ContentContext`가 마운트 시 ① Supabase fetch 시도 → 성공하면 표시+캐시
  갱신, ② 실패하면 캐시 로드, ③ 캐시 없으면 `content.ts` 정적 데이터를
  동일 도메인 타입으로 변환해 사용. 어떤 경로든 UI에는 장애 안내를 붙이지
  않는다(조용히 표시 — Clarify 확정). fetch 완료 전에는 직전 데이터(캐시
  또는 정적)를 우선 표시해 빈 화면을 만들지 않는다.
- **Rationale**: FR-018의 ①②단계와 SC-005(빈 화면 0건)를 그대로 구현.
  손상된 캐시(JSON 파싱 실패)는 삭제 후 정적 폴백으로 진행.
- **Alternatives considered**: Service Worker 캐싱(오버엔지니어링 — 기각),
  IndexedDB(데이터가 작아 localStorage로 충분 — 기각).

## R7. 마크다운 렌더링

- **Decision**: `react-markdown` (remark 기반). raw HTML 패스스루를 켜지
  않는다(기본값) — 스크립트 실행 불가(FR-006 안전 렌더링).
- **Rationale**: React 트리로 직접 렌더링해 `dangerouslySetInnerHTML`이
  필요 없고, 기본 설정이 곧 안전 설정이다.
- **Alternatives considered**: marked + DOMPurify(별도 sanitize 단계 필요,
  두 의존성 — 기각), 자체 파서(범위 밖 — 기각).

## R8. 정렬 규칙 구현

- **Decision**: 쿼리 정렬 `ORDER BY display_order ASC NULLS LAST,
  created_at DESC`. 노트북 목록은 클라이언트에서 상태 그룹(진행 중 → 완성)
  으로 안정 정렬 후 그룹 내 위 규칙 유지. 화이트보드(예정)도 동일 규칙.
- **Rationale**: Clarify 확정안(수동 순서 우선 + 최신순 보조)의 직역.

## R9. 테스트 전략 (헌법 원칙 I·II 적용)

- **Decision**:
  - supabase-js 접점은 `contentRepository.ts`(방문자 read)와
    `adminRepository.ts`(관리자 CRUD/업로드/인증) 두 모듈로만 한정.
  - 컴포넌트·컨텍스트·훅 테스트는 레포지토리 인터페이스의 **fake 구현**
    (인메모리, 인터페이스 전체 구현)을 주입해 실제 동작을 검증한다.
  - 레포지토리 자체 테스트는 supabase-js 클라이언트 객체를 최소 표면
    (체이닝 쿼리 빌더)으로 스텁하되, 실제 응답 구조(data/error 필드)를
    완전한 형태로 재현한다 — 불완전 모의 금지.
  - 파일 검증·정렬·매핑·캐시 로직은 순수 함수로 분리해 모킹 없이 테스트.
- **Rationale**: "모의 동작이 아닌 실제 동작 테스트"(원칙 II)를 지키면서
  네트워크 없는 단위 테스트를 유지한다.
- **Alternatives considered**: msw로 HTTP 레벨 모킹(supabase-js 내부 URL
  구조에 결합되어 취약 — 기각), 실제 Supabase 테스트 프로젝트 연동(로컬
  테스트가 네트워크 의존 — 기각. 단, quickstart의 수동 검증으로 보완).

## R10. 기존 방문자 UI와의 호환

- **Decision**: `content.ts`의 기존 타입(Project/Tech/FutureProject)을
  방문자 표시용 도메인 타입으로 승격하되, DB 스키마는 spec 필드(제목/설명
  마크다운/상태/기술/링크/순서/이미지)로 단순화한다. 정적 데이터는 어댑터
  함수로 동일 도메인 타입에 매핑(기존 highlights는 마크다운 목록으로 변환).
  책장의 책 색상은 `tech_stack.color`(선택, 기본값 `#7f9aa6`)로 보존 —
  명세 외 항목이지만 명세 001의 2.5D 책장 시각 요구(FR-015)를 유지하기 위한
  최소 추가.
- **Rationale**: 방문자 UI(책장 책등 색, 노트북 에디터 패널)를 깨지 않고
  데이터 원천만 교체한다.
