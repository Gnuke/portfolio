<!--
Sync Impact Report
==================
Version change: (template) → 1.0.0 (initial ratification)
Modified principles: n/a (initial creation — all 5 principles newly defined)
  - I. 테스트 주도 개발 (TDD) — NON-NEGOTIABLE
  - II. 테스트 품질 및 모킹 규율
  - III. 타입 안전성
  - IV. 단순성 (YAGNI)
  - V. 증거 기반 완료 선언
Added sections:
  - 기술 스택 및 테스트 환경
  - 개발 워크플로우 및 품질 게이트
Removed sections: none
Templates requiring updates:
  - ✅ .specify/templates/plan-template.md (Constitution Check 게이트를 구체 항목으로 교체)
  - ✅ .specify/templates/tasks-template.md (테스트 OPTIONAL 문구를 TDD 의무로 교체)
  - ✅ .specify/templates/spec-template.md (변경 불필요 — 충돌 없음 확인)
  - ✅ .specify/templates/checklist-template.md (변경 불필요 — 요구사항 품질 체크 전용)
Follow-up TODOs: none
-->

# Only One Room 헌법

인터랙티브 포트폴리오 홈페이지 "Only One Room"(개발자의 자취방을 탐험하는
웹 경험) 프로젝트의 개발 원칙과 품질 기준을 정의한다.

## Core Principles

### I. 테스트 주도 개발 (TDD) — NON-NEGOTIABLE

모든 프로덕션 코드는 superpowers의 `/test-driven-development` 스킬
(`superpowers:test-driven-development`)이 정의한 TDD 절차를 따라 작성해야 한다
(MUST). 구현 작업을 시작하기 전에 반드시 해당 스킬을 로드하여 그 내용을 그대로
따른다.

**Iron Law**: `실패하는 테스트 없이는 프로덕션 코드도 없다`
(NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST)

- **적용 범위**: 신규 기능, 버그 수정, 리팩토링, 동작 변경 — 예외 없이 전부.
- **Red-Green-Refactor 사이클을 엄격히 준수한다 (MUST)**:
  1. **RED**: 원하는 동작을 보여주는 최소한의 실패 테스트를 먼저 작성한다.
  2. **Verify RED (필수, 생략 금지)**: 테스트를 실행하여 실패를 직접 확인한다.
     오류(error)가 아닌 실패(fail)여야 하며, 기능 부재가 실패 원인이어야 한다.
     즉시 통과하는 테스트는 아무것도 증명하지 못한다.
  3. **GREEN**: 테스트를 통과시키는 최소한의 코드만 작성한다.
  4. **Verify GREEN (필수)**: 해당 테스트와 기존 테스트 전체가 통과하고 출력이
     깨끗한지(오류·경고 없음) 확인한다.
  5. **REFACTOR**: 그린 상태를 유지하며 중복 제거·이름 개선만 수행한다.
- **테스트보다 먼저 작성된 코드는 삭제하고 다시 시작한다 (MUST)**. "참고용
  보관", "테스트 작성하며 적응" 금지 — 삭제는 삭제를 의미한다.
- **버그 수정은 반드시 버그를 재현하는 실패 테스트부터 시작한다 (MUST)**.
  테스트 없는 버그 수정은 금지된다.
- **예외**(폐기용 프로토타입, 자동 생성 코드, 설정 파일)는 사용자의 명시적
  허가가 있을 때만 인정된다. "이번 한 번만 건너뛰자"는 합리화이며 금지된다.
- **완료 선언 전 스킬의 Verification Checklist 전 항목을 충족해야 한다 (MUST)**:
  모든 신규 함수에 테스트 존재, 각 테스트의 실패를 직접 목격, 예상된 이유로
  실패, 최소 구현, 전체 테스트 통과, 깨끗한 출력, 실제 코드 사용(불가피한
  경우에만 모킹), 엣지 케이스 커버.

근거: 테스트가 실패하는 것을 보지 못했다면 그 테스트가 올바른 것을 검증하는지
알 수 없다. 규칙의 문구를 어기는 것은 규칙의 정신을 어기는 것이다.

### II. 테스트 품질 및 모킹 규율

테스트는 실제 동작을 검증해야 하며, 모의(mock)는 격리 수단일 뿐 검증 대상이
아니다. 모킹 관련 규칙은 `superpowers:test-driven-development` 스킬의
`testing-anti-patterns.md`를 그대로 따른다 (MUST).

- **모의 동작을 테스트하지 않는다 (MUST NOT)**: 모의 요소의 존재를 단언하는
  테스트는 금지. 실제 컴포넌트 동작을 테스트하거나 모의를 제거한다.
- **프로덕션 클래스에 테스트 전용 메서드를 추가하지 않는다 (MUST NOT)**:
  테스트 정리(cleanup) 등은 테스트 유틸리티로 분리한다.
- **의존성을 이해하기 전에 모킹하지 않는다 (MUST NOT)**: 실제 메서드의 부수
  효과와 테스트의 의존 관계를 먼저 파악하고, 불확실하면 실제 구현으로 먼저
  실행해본 뒤 올바른 수준에서 최소한으로 모킹한다. "안전하게 일단 모킹"은
  금지된다.
- **불완전한 모의를 만들지 않는다 (MUST NOT)**: 모의 응답은 실제 API가
  반환하는 전체 데이터 구조를 반영해야 한다. 부분 모의는 조용히 실패한다.
- **모의 설정이 테스트 로직보다 길어지면** 설계를 의심하고 실제 컴포넌트를
  사용하는 통합 테스트를 고려한다.
- 각 테스트는 **하나의 동작**만 검증하고, 이름이 동작을 설명하며, 원하는 API
  사용법을 보여줘야 한다.

### III. 타입 안전성

- TypeScript `strict` 모드를 유지한다 (MUST). 완화 금지.
- `npm run typecheck`(`tsc --noEmit`) 통과는 모든 작업 완료의 전제 조건이다
  (MUST).
- `any` 타입은 외부 경계에서 불가피한 경우를 제외하고 사용하지 않는다
  (SHOULD NOT). 사용 시 이유를 주석으로 남긴다.

근거: 컴파일 타임 타입 검증은 테스트가 커버하지 못하는 구조적 오류를 잡는
첫 번째 방어선이다.

### IV. 단순성 (YAGNI)

- 테스트를 통과시키는 데 필요한 최소한의 코드만 작성한다 (MUST). 테스트가
  요구하지 않는 옵션, 설정, 일반화를 추가하지 않는다.
- 추측에 기반한 기능("나중에 필요할지도")은 금지된다 (MUST NOT).
- 구조적 복잡성(새 추상화 계층, 패턴 도입 등)은 plan.md의 Complexity
  Tracking에 정당화를 기록해야만 도입할 수 있다 (MUST).

### V. 증거 기반 완료 선언

- "완료", "수정됨", "통과" 등의 주장은 검증 명령을 실행하고 그 출력을 확인한
  후에만 할 수 있다 (MUST). 단언보다 증거가 먼저다.
- 작업 완료의 최소 증거: `npm test` 전체 통과 + `npm run typecheck` 통과 +
  깨끗한 출력(오류·경고 없음).
- 실패한 테스트나 건너뛴 단계가 있으면 있는 그대로 보고한다 (MUST).

## 기술 스택 및 테스트 환경

프로젝트의 확정된 기술 스택과 테스트 인프라. 변경 시 헌법 개정이 필요하다.

- **런타임 스택**: Vite 5 + React 18 + TypeScript 5 (SPA, `src/` 단일 프로젝트)
- **테스트 프레임워크**: Vitest 3 — Vite 설정(`vite.config.js`의 `test` 블록)을
  그대로 공유하므로 이 프로젝트에 가장 적합한 선택이다.
- **테스트 환경**: jsdom (DOM 시뮬레이션), `globals: true`
- **컴포넌트 테스트**: React Testing Library + `@testing-library/jest-dom`
  matcher + `@testing-library/user-event` (실제 사용자 상호작용 시뮬레이션)
- **셋업 파일**: `src/test/setup.ts` (jest-dom matcher 등록)
- **테스트 파일 규약**: `*.test.ts` / `*.test.tsx` — 대상 코드 옆에 배치
  (co-location)하거나 공용 테스트는 `src/test/`에 배치한다.
- **실행 명령**:
  - `npm test` — 전체 1회 실행 (완료 검증용)
  - `npm run test:watch` — 감시 모드 (TDD 사이클용)
  - `npx vitest run <파일경로>` — 단일 파일 실행 (RED/GREEN 확인용)
- **모킹**: Vitest 내장 `vi` 사용. 원칙 II의 모킹 규율을 반드시 준수한다.

## 개발 워크플로우 및 품질 게이트

- **spec-kit 흐름을 따른다**: `/speckit-specify` → (`/speckit-clarify`) →
  `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`.
- **tasks.md 생성 규칙**: 모든 유저 스토리에서 테스트 태스크는 필수이며
  (원칙 I에 의해 OPTIONAL이 될 수 없다), 해당 스토리의 구현 태스크보다
  반드시 먼저 배치되어야 한다. 테스트가 작성되고 실패하는 것을 확인한 후에만
  구현 태스크를 진행할 수 있다.
- **구현 시작 게이트**: `/speckit-implement` 실행 시 각 구현 태스크 착수 전에
  `superpowers:test-driven-development` 스킬을 로드하여 따른다.
- **완료 게이트**: 태스크/스토리/기능의 완료 선언은 원칙 V의 최소 증거를
  갖춘 후에만 가능하다.
- **plan.md의 Constitution Check**: 계획 단계에서 본 헌법의 각 원칙에 대한
  준수 여부를 게이트로 검증하며, 위반은 Complexity Tracking에 정당화를
  기록해야 한다.

## Governance

- 본 헌법은 이 프로젝트의 다른 모든 개발 관행과 지침에 우선한다.
- **개정 절차**: 개정안은 변경 내용과 근거를 문서화하고 사용자의 승인을 받아야
  하며, 승인 즉시 본 파일과 의존 템플릿(plan/spec/tasks)에 전파되어야 한다.
- **버전 정책** (Semantic Versioning):
  - **MAJOR**: 원칙의 제거 또는 호환 불가능한 재정의 (예: TDD 의무 완화)
  - **MINOR**: 새 원칙/섹션 추가 또는 실질적 지침 확장
  - **PATCH**: 문구 명확화, 오탈자 수정 등 비의미적 정제
- **준수 검토**: 모든 계획(plan.md)은 Constitution Check 게이트를 통과해야
  하며, 모든 구현 완료 선언은 원칙 I·V의 검증 체크리스트 충족을 전제로 한다.
- 복잡성 도입은 반드시 정당화되어야 하며, 정당화할 수 없는 복잡성은 제거한다.

**Version**: 1.0.0 | **Ratified**: 2026-07-13 | **Last Amended**: 2026-07-13
