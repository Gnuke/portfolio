# Tasks: 관리자 프로젝트 콘텐츠 관리 (Admin Project CMS)

**Input**: Design documents from `/specs/002-admin-project-cms/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are MANDATORY per Constitution Principle I (TDD — NON-NEGOTIABLE).
각 RED 태스크는 실패를 직접 확인해야 하고(`npx vitest run <file>`), GREEN
태스크는 해당 테스트+전체 테스트 통과를 확인해야 한다
(`superpowers:test-driven-development` 준수).

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 의존성·엔트리·백엔드 스키마 준비

- [X] T001 Install deps (`npm install @supabase/supabase-js react-markdown`),
      create `.env.local` (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY —
      값은 quickstart.md), verify `.gitignore` covers `.env.local`
- [X] T002 Add admin entry: create `admin.html` (shell) + `vite.config.js`
      `build.rollupOptions.input` MPA 설정 (index.html + admin.html), verify
      `npm run build` emits both
- [X] T003 [P] Apply Supabase migrations 1–3 via MCP `apply_migration`
      (contracts/database.md 순서대로: create_content_tables,
      enable_rls_policies, create_storage_bucket), save SQL copies under
      `supabase/migrations/`, verify with `list_tables`
- [X] T004 [P] Auth 수동 프로비저닝 확인 (USER ACTION — quickstart.md 사전
      준비 2): 대시보드에서 sign-ups OFF + 관리자 계정 1개 생성. 코드 작업
      아님, 완료 여부만 확인·기록 — 2026-07-13 확인: 가입 프로브 422
      signup_disabled, 계정 2개(소유자 + 검토용 admin@administer.com, 검토
      종료 후 삭제 권장), 로그인 API 실측 성공

**Checkpoint**: `npm run build` 성공 + Supabase 테이블 3개 존재

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 스토리가 의존하는 타입·클라이언트·테스트 인프라

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 [P] Domain types in `src/data/types.ts` (ProjectStatus,
      ProjectRecord, ProjectImageRecord, TechStackRecord, RoomContent —
      data-model.md 정의 그대로) + AdminRepository/ProjectInput/TechInput
      인터페이스 in `src/admin/adminRepository.types.ts`
      (contracts/repositories.md 그대로)
- [X] T006 [P] Supabase client singleton in `src/lib/supabaseClient.ts`
      (env 기반, 설정 글루 — 헌법 TDD 예외: 설정 파일)
- [X] T007 Fake AdminRepository (인메모리, 인터페이스 **전체** 구현 — 불완전
      모의 금지) + fixture builders in `src/test/fakes.ts`

**Checkpoint**: `npm run typecheck` 통과 — user story implementation can begin

---

## Phase 3: User Story 1 - 관리자 로그인과 접근 제어 (Priority: P1) 🎯 MVP

**Goal**: 별도 admin.html에서 이메일/비밀번호 로그인, 미로그인 차단, 로그아웃,
일반화된 실패 메시지 (FR-001~005)

**Independent Test**: quickstart.md US1 시나리오 — 로그인 요구/성공/실패/
로그아웃/방문자 UI 비노출

### Tests for User Story 1 (MANDATORY — Constitution Principle I: TDD) ⚠️

> **RED: 작성 후 `npx vitest run <file>`로 실패를 직접 확인할 것**

- [X] T008 [P] [US1] RED: LoginForm tests in `src/admin/LoginForm.test.tsx` —
      이메일/비밀번호 입력 후 제출 시 signIn 호출, 빈 필드 검증, signIn 실패
      시 "이메일 또는 비밀번호가 올바르지 않습니다" 단일 메시지(원인 미특정)
- [X] T009 [P] [US1] RED: AdminApp session gate tests in
      `src/admin/AdminApp.test.tsx` — 세션 없음 → LoginForm만 렌더(관리 UI
      부재), 세션 있음 → 대시보드 + 로그아웃 버튼, 로그아웃 → 게이트 복귀,
      onSessionChange 반영
- [X] T010 [P] [US1] RED: adminRepository auth tests in
      `src/admin/adminRepository.test.ts` — supabase 클라이언트 스텁(완전한
      data/error 응답 구조)으로 signIn 성공/실패 throw, getSession 매핑,
      signOut 위임

### Implementation for User Story 1

- [X] T011 [US1] GREEN: LoginForm in `src/admin/LoginForm.tsx` (T008 통과 최소
      구현)
- [X] T012 [US1] GREEN: AdminApp in `src/admin/AdminApp.tsx` + bootstrap
      `src/admin/main.tsx` + `src/admin/admin.css` (T009 통과)
- [X] T013 [US1] GREEN: adminRepository auth 메서드 in
      `src/admin/adminRepository.ts` (T010 통과)
- [X] T014 [US1] Verify gate: 전체 `npm test` + `npm run typecheck` 그린 확인
      후 quickstart US1 수동 시나리오 실행 (dev 서버) — 자동 게이트 그린 +
      로그인 성공/실패 Auth API 실측 + 방문자 번들 admin 코드 0건 확인

**Checkpoint**: 관리자 로그인/로그아웃/차단이 독립 동작

---

## Phase 4: User Story 2 - 프로젝트 등록·조회·수정·삭제 (Priority: P2)

**Goal**: 프로젝트(3상태)와 기술 스택 CRUD, 필수값 검증, 삭제 확인
(FR-006~011, FR-020)

**Independent Test**: quickstart.md US2 — 등록→목록→수정→상태 전환→삭제 전주기
+ 기술 스택 CRUD

### Tests for User Story 2 (MANDATORY — Constitution Principle I: TDD) ⚠️

- [X] T015 [P] [US2] RED: ProjectForm tests in `src/admin/ProjectForm.test.tsx`
      — 필수값(제목/설명/상태) 누락 시 필드별 안내+저장 거부, 유효 입력 시
      createProject/updateProject 호출 인자 검증, 상태 3값 전환
- [X] T016 [P] [US2] RED: ProjectList tests in `src/admin/ProjectList.test.tsx`
      — 목록에 제목+상태 배지(진행 중/완성/예정) 표시, 삭제 클릭 시 확인
      절차 후에만 deleteProject 호출, 취소 시 미호출
- [X] T017 [P] [US2] RED: TechStackManager tests in
      `src/admin/TechStackManager.test.tsx` — 목록 표시, 추가(이름 필수),
      수정, 삭제(확인 절차)
- [X] T018 [P] [US2] RED: adminRepository project/tech CRUD tests in
      `src/admin/adminRepository.test.ts` 확장 — 행↔도메인 매핑, 오류 전파

### Implementation for User Story 2

- [X] T019 [US2] GREEN: ProjectForm in `src/admin/ProjectForm.tsx` (T015 통과)
- [X] T020 [US2] GREEN: ProjectList in `src/admin/ProjectList.tsx` (T016 통과)
- [X] T021 [US2] GREEN: TechStackManager in `src/admin/TechStackManager.tsx`
      (T017 통과)
- [X] T022 [US2] GREEN: adminRepository CRUD in `src/admin/adminRepository.ts`
      (T018 통과) + AdminApp 대시보드에 목록/폼/스택 관리 연결
- [X] T023 [US2] Verify gate: 전체 테스트+typecheck 그린, quickstart US2 수동
      시나리오 — 2026-07-13 사용자 실측: 프로젝트 등록→수정→삭제 전주기 +
      기술 스택 추가(Python) 정상 동작 확인

**Checkpoint**: US1+US2 독립 동작 — 콘텐츠 관리 가능

---

## Phase 5: User Story 3 - 프로젝트 화면(이미지) 업로드 (Priority: P3)

**Goal**: 이미지 업로드(형식/용량/개수 검증), 미리보기, 대표 지정, 삭제,
프로젝트 삭제 시 스토리지 정리 (FR-012~015)

**Independent Test**: quickstart.md US3 — 업로드/거부/대표 지정/삭제

### Tests for User Story 3 (MANDATORY — Constitution Principle I: TDD) ⚠️

- [X] T024 [P] [US3] RED: imageValidation tests in
      `src/admin/imageValidation.test.ts` — 허용 4형식 통과, 비이미지 거부
      (reason 'type'), >5MB 거부('size'), 10장 초과('count') — 순수 함수,
      모킹 없음
- [X] T025 [P] [US3] RED: ImageUploader tests in
      `src/admin/ImageUploader.test.tsx` — 유효 파일 선택 시 uploadImage 호출
      +미리보기, 무효 파일은 허용 형식·용량 안내+미호출, 개별 삭제, 대표 지정
      시 setCoverImage 호출, 업로드 실패 시 오류 안내+재시도 가능
- [X] T026 [P] [US3] RED: adminRepository image tests in
      `src/admin/adminRepository.test.ts` 확장 — 업로드 경로 규칙
      `projects/{projectId}/{uuid}.{ext}`, setCoverImage가 기존 대표 해제 후
      지정, deleteProject가 연결 이미지 storage 경로 삭제 포함

### Implementation for User Story 3

- [X] T027 [US3] GREEN: imageValidation in `src/admin/imageValidation.ts`
      (T024 통과)
- [X] T028 [US3] GREEN: ImageUploader in `src/admin/ImageUploader.tsx` +
      ProjectForm 통합 (T025 통과)
- [X] T029 [US3] GREEN: adminRepository 이미지 메서드/삭제 정리 in
      `src/admin/adminRepository.ts` (T026 통과)
- [X] T030 [US3] Verify gate: 전체 테스트+typecheck 그린, quickstart US3 수동
      시나리오 — 2026-07-13 사용자 실측: 이미지 업로드·미리보기·대표 지정
      정상 동작 확인 (형식·용량 거부는 단위 테스트 + 서버 버킷 제약으로 검증)

**Checkpoint**: 이미지 포함 콘텐츠 관리 완결

---

## Phase 6: User Story 4 - 방문자 방 화면에 관리 데이터 반영 (Priority: P4)

**Goal**: 노트북(통합 목록+배지+이전/다음+갤러리+마크다운), 화이트보드(예정),
책장(기술 스택)이 관리 데이터 표시. 캐시→정적 조용한 폴백, 0건 시 "준비 중"
(FR-016~019, FR-021)

**Independent Test**: quickstart.md US4 — 등록 데이터 반영 + Offline 폴백 +
0건 안내

### Tests for User Story 4 (MANDATORY — Constitution Principle I: TDD) ⚠️

- [X] T031 [P] [US4] RED: sortContent tests in `src/data/sortContent.test.ts`
      — 진행 중 그룹 우선, 그룹 내 display_order ASC NULLS LAST → created_at
      DESC, 갤러리는 대표 우선 — 순수 함수
- [X] T032 [P] [US4] RED: contentCache tests in `src/data/contentCache.test.ts`
      — save/load 왕복, 손상 JSON → null+키 제거, 캐시 없음 → null
- [X] T033 [P] [US4] RED: staticContent adapter tests in
      `src/data/staticContent.test.ts` — content.ts → RoomContent 변환
      (highlights → 마크다운 목록, source: 'static')
- [X] T034 [P] [US4] RED: contentRepository tests in
      `src/data/contentRepository.test.ts` — supabase 스텁 행 → RoomContent
      매핑(공개 URL 파생 포함), 조회 실패 시 reject
- [X] T035 [US4] RED: ContentContext fallback chain tests in
      `src/context/ContentContext.test.tsx` — 원격 성공 → remote 표시+캐시
      저장, 원격 실패+캐시 있음 → cache 표시, 캐시 없음 → static 표시, 어떤
      경우도 장애 안내 미노출
- [X] T036 [US4] RED: InformationPanel tests in
      `src/components/InformationPanel.test.tsx` — 프로젝트 여러 건 이전/다음
      전환+상태 배지, 마크다운 렌더(스크립트 미실행), 이미지 갤러리 대표 우선
      이전/다음, 예정 프로젝트→화이트보드, 기술 스택→책장, 0건 시 "준비 중"

### Implementation for User Story 4

- [X] T037 [US4] GREEN: sortContent in `src/data/sortContent.ts` (T031 통과)
- [X] T038 [US4] GREEN: contentCache in `src/data/contentCache.ts` (T032 통과)
- [X] T039 [US4] GREEN: staticContent adapter in `src/data/staticContent.ts`
      (T033 통과)
- [X] T040 [US4] GREEN: contentRepository in `src/data/contentRepository.ts`
      (T034 통과)
- [X] T041 [US4] GREEN: ContentContext in `src/context/ContentContext.tsx` +
      `src/main.tsx`에 Provider 연결 (T035 통과)
- [X] T042 [US4] GREEN: InformationPanel 개편 in
      `src/components/InformationPanel.tsx` — context 소비, 이전/다음, 배지,
      갤러리, 마크다운, 준비 중 안내 (T036 통과) + 필요한 패널 스타일
      `src/styles.css` 보강
- [X] T043 [US4] Verify gate: 전체 테스트+typecheck 그린, quickstart US4 수동
      시나리오(Offline 폴백 포함) — 2026-07-13 사용자 실측: 관리자 기술 추가
      (Python) → 온라인 방문자 책장 반영 확인 → 오프라인 새로고침에서 캐시
      폴백 정상. 데이터 파이프라인은 라이브 통합 테스트로도 검증됨
      (정적 폴백·갤러리·이전/다음은 단위 테스트 커버)

**Checkpoint**: 모든 스토리 완결 — 관리 데이터가 방문자 화면의 원천

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T044 `npm run build` 두 엔트리 산출 확인 + 방문자 번들에 admin 코드
      미포함 확인 (dist 산출물 검사)
- [X] T045 [P] README.md 갱신 — 관리자 페이지 사용법, env 설정, 콘텐츠 관리
      절차(content.ts는 폴백으로 역할 변경)
- [X] T046 quickstart.md 전체 수동 검증 + SC 대응표 체크, 잔여 이슈 기록 —
      2026-07-13 완료: US1(로그인 API 실측+사용), US2·US3(사용자 클릭 실측),
      US4(반영+캐시 폴백 실측, 라이브 통합 테스트). SC-001~007 전부 충족 확인.
      잔여 이슈 없음. 후속 메모: 과제 검토 종료 후 검토용 계정
      (admin@administer.com) 삭제 필요

---

## Dependencies & Execution Order

- **Setup (Phase 1)** → **Foundational (Phase 2)** → 스토리들 → **Polish**
- US1 → US2 → US3은 adminRepository/AdminApp을 점증 확장하므로 우선순위
  순서대로 진행 (같은 파일 확장 — 병렬 불가)
- US4는 Foundational만 의존하므로 이론상 US1~3과 병렬 가능하나, 단독 작업
  시 우선순위 순서 권장
- 각 스토리 내: RED([P] 가능, 서로 다른 파일) → GREEN(대응 테스트 통과 후)
  → Verify gate

## Parallel Example: User Story 1

```bash
# RED 3건은 서로 다른 파일 — 동시 작성 가능:
Task: T008 LoginForm.test.tsx
Task: T009 AdminApp.test.tsx
Task: T010 adminRepository.test.ts
# 이후 GREEN은 T011 → T012 → T013 순서 권장 (컴포넌트 조립 의존)
```

## Implementation Strategy

- **MVP First**: Phase 1~3 (US1) 완료 후 중단·검증 가능 — 로그인 게이트가
  서면 이후 스토리는 안전하게 점증
- **Incremental Delivery**: 각 스토리 checkpoint에서 quickstart 수동 검증 후
  다음 스토리 진행
- 모든 태스크 완료 선언 전: 해당 테스트 실패→통과 목격 + 전체 `npm test` +
  `npm run typecheck` 그린 (헌법 원칙 I·V)
