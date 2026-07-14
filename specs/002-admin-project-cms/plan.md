# Implementation Plan: 관리자 프로젝트 콘텐츠 관리 (Admin Project CMS)

**Branch**: `002-admin-project-cms` | **Date**: 2026-07-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-admin-project-cms/spec.md`

## Summary

방문자용 방 화면과 분리된 관리자 페이지를 추가한다. 관리자는 Supabase Auth
(이메일/비밀번호, 단일 계정)로 로그인하여 프로젝트(진행 중/완성/예정)와 기술
스택을 CRUD하고, 프로젝트 스크린샷 이미지를 Supabase Storage에 업로드한다.
방문자 화면(노트북·화이트보드·책장 패널)은 정적 데이터 대신 Supabase 데이터를
표시하며, 로드 성공 시 localStorage에 캐시하고 장애 시 캐시 → 내장 정적
데이터 순으로 조용히 폴백한다. 관리자 페이지는 Vite 멀티 엔트리(`admin.html`)
로 분리해 방문자 번들에 관리 코드·진입점이 일절 포함되지 않게 한다.

## Technical Context

**Language/Version**: TypeScript 5.6 (strict), React 18.3, Vite 5.4

**Primary Dependencies**:
- `@supabase/supabase-js` v2 — DB/Auth/Storage 클라이언트 (신규)
- `react-markdown` — 방문자 패널의 마크다운 안전 렌더링 (신규, raw HTML 미허용)
- 기존: React 18, CSS(디자인 토큰), 상태관리는 useState/Context (라이브러리 없음)

**Storage**: Supabase 프로젝트 `onaormuhkjekmcezeccn`
(https://onaormuhkjekmcezeccn.supabase.co) — 현재 테이블/마이그레이션 0개(빈
프로젝트). Postgres 테이블 3개(projects, project_images, tech_stack) + Storage
버킷 1개(project-images). 방문자 캐시는 localStorage.

**Testing**: Vitest 3 + React Testing Library + jsdom (001에서 구축 완료).
`npm test` / `npx vitest run <file>`. TDD 의무 (헌법 원칙 I).

**Target Platform**: 데스크톱 브라우저 (정적 호스팅 SPA + Supabase BaaS, 서버
코드 없음)

**Project Type**: Web SPA (프론트엔드 단독 + BaaS)

**Performance Goals**: 관리 작업 피드백 ≤5초(SC-006), 방문자 콘텐츠는 다음
로드 반영(SC-003), 빈 화면 0건(SC-005)

**Constraints**:
- 방문자 UI에 관리자 진입 요소 노출 금지 (FR-001)
- 방문자 경험은 단일 화면·페이지 이동 없음 유지 (명세 001)
- 이미지: PNG/JPEG/WebP/GIF, 파일당 5MB, 프로젝트당 최대 10장
- 회원가입 없음 — 관리자 계정은 Supabase 대시보드에서 1회 수동 프로비저닝

**Scale/Scope**: 개인 포트폴리오 (동시 접속 수십 명, 프로젝트 수십 건 이하)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

*Only One Room 헌법 v1.0.0 기준 (`.specify/memory/constitution.md`):*

- [x] **I. TDD (NON-NEGOTIABLE)**: 모든 구현 태스크는 실패 테스트 선행. 레포지
      토리·캐시/폴백 로직·훅·폼 검증·패널 렌더링 각각 테스트 태스크가 구현
      태스크보다 먼저 배치된다. `superpowers:test-driven-development` 준수.
- [x] **II. 테스트 품질/모킹 규율**: supabase-js 호출은 얇은 레포지토리 모듈로
      캡슐화하고, 컴포넌트/훅 테스트는 레포지토리를 의존성 주입(fake)으로
      대체한다 — supabase 클라이언트를 광범위 모킹하지 않는다. fake는 실제
      레포지토리 인터페이스 전체를 구현한다 (불완전 모의 금지).
- [x] **III. 타입 안전성**: strict 유지, DB 행 ↔ 도메인 타입 매핑 함수에 명시
      타입. `npm run typecheck` 통과가 완료 조건.
- [x] **IV. 단순성 (YAGNI)**: 라우터 미도입(Vite 멀티 엔트리로 대체), 상태관리
      라이브러리 미도입, 서버/엣지 함수 미도입. 신규 의존성은 supabase-js와
      react-markdown 2개뿐.
- [x] **V. 증거 기반 완료**: 각 태스크 완료 = 해당 테스트 통과 + 전체
      `npm test` 그린 + `npm run typecheck` 통과 확인 후 선언.

**Post-Phase-1 재평가**: 통과 — 설계 산출물이 신규 추상화를 레포지토리 계층
하나로 제한했고, 위반 사항 없음 (Complexity Tracking 공란).

## Project Structure

### Documentation (this feature)

```text
specs/002-admin-project-cms/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── database.md      #   DB 스키마 + RLS + Storage 계약
│   └── repositories.md  #   레포지토리 TS 인터페이스 계약
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
index.html                       # 방문자 엔트리 (기존)
admin.html                       # 관리자 엔트리 (신규 — Vite MPA input)
supabase/
└── migrations/                  # 적용한 마이그레이션 SQL 사본 (MCP로 적용)
src/
├── lib/
│   └── supabaseClient.ts        # supabase-js 싱글턴 (env: VITE_SUPABASE_*)
├── data/
│   ├── content.ts               # 유지 — 정적 폴백 데이터 (원천에서 폴백으로 역할 변경)
│   ├── types.ts                 # 도메인 타입 (RoomContent, ProjectRecord …)
│   ├── contentRepository.ts     # 방문자 read: Supabase → RoomContent 매핑
│   └── contentCache.ts          # localStorage 캐시 (저장/로드/버전)
├── context/
│   ├── ThemeContext.tsx         # 기존
│   └── ContentContext.tsx       # 신규 — fetch → cache → static 폴백 체인 제공
├── components/
│   ├── InformationPanel.tsx     # 수정 — context 소비, 이전/다음, 갤러리, 마크다운
│   └── (기존 컴포넌트 유지)
├── admin/
│   ├── main.tsx                 # 관리자 앱 부트스트랩
│   ├── AdminApp.tsx             # 세션 게이트: 미로그인 → LoginForm, 로그인 → 대시보드
│   ├── adminRepository.ts       # CRUD/업로드/인증 — supabase-js 캡슐화
│   ├── LoginForm.tsx
│   ├── ProjectList.tsx          # 목록 + 상태 배지 + 삭제(확인)
│   ├── ProjectForm.tsx          # 등록/수정 + 검증 + ImageUploader
│   ├── ImageUploader.tsx        # 형식/용량 검증, 미리보기, 대표 지정, 삭제
│   ├── TechStackManager.tsx     # 기술 스택 목록/추가/수정/삭제
│   └── admin.css                # 관리자 화면 스타일 (방문자 CSS와 분리)
└── test/                        # 기존 셋업 + 공용 fake 레포지토리
```

**Structure Decision**: 단일 프로젝트 유지. 관리자 화면은 `src/admin/` 아래
독립 트리 + `admin.html` 엔트리로 분리하여 방문자 번들과 코드·스타일이 섞이지
않는다. 테스트는 대상 코드 옆 co-location (`*.test.ts(x)`).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

(위반 없음 — 해당 없음)
