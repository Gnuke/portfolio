# Data Model: 관리자 프로젝트 콘텐츠 관리 (Phase 1)

**Date**: 2026-07-13 | **Plan**: [plan.md](./plan.md) |
**DB 계약**: [contracts/database.md](./contracts/database.md)

## 엔티티

### Project (`projects` 테이블)

| 필드 | 타입 | 필수 | 설명 |
|------|------|:---:|------|
| `id` | uuid (PK) | 자동 | `gen_random_uuid()` |
| `title` | text | ✅ | 프로젝트 제목. 공백만은 불가 |
| `description` | text | ✅ | 마크다운 본문. 공백만은 불가 |
| `status` | text | ✅ | `'current'`(진행 중) · `'completed'`(완성) · `'planned'`(예정) — CHECK 제약 |
| `tagline` | text | — | 한 줄 소개 (노트북 패널 상단) |
| `stack` | text[] | — | 사용 기술 목록 (기본 `{}`) |
| `links` | jsonb | — | `[{ label, href, disabled? }]` (기본 `[]`) |
| `display_order` | int | — | 수동 표시 순서. NULL이면 최신순 보조 정렬 |
| `created_at` | timestamptz | 자동 | `now()` |
| `updated_at` | timestamptz | 자동 | `now()`, 수정 시 트리거로 갱신 |

**상태 전이**: `current ↔ completed ↔ planned` 모든 방향 자유 전환 (FR-008).

**노출 규칙**:
- 노트북 패널: `status IN ('current','completed')` — 진행 중 그룹 먼저, 그룹
  내 `display_order ASC NULLS LAST, created_at DESC` (FR-017)
- 화이트보드 패널: `status = 'planned'` — 동일 정렬 규칙

### ProjectImage (`project_images` 테이블)

| 필드 | 타입 | 필수 | 설명 |
|------|------|:---:|------|
| `id` | uuid (PK) | 자동 | |
| `project_id` | uuid (FK → projects, ON DELETE CASCADE) | ✅ | |
| `storage_path` | text | ✅ | 버킷 내 경로 `projects/{projectId}/{uuid}.{ext}` |
| `display_order` | int | — | 갤러리 순서 (기본 0) |
| `is_cover` | boolean | — | 대표 이미지 여부 (기본 false) |
| `created_at` | timestamptz | 자동 | |

**불변식**:
- 프로젝트당 이미지 ≤ 10장 (클라이언트 강제 + 저장 전 확인)
- 대표 이미지는 프로젝트당 최대 1장 — 대표 지정 시 기존 대표를 해제하고 지정
  (레포지토리에서 원자적으로 처리)
- 이미지가 있는데 대표가 없으면 `display_order` 첫 번째를 대표로 간주(표시 규칙)

**갤러리 정렬**: 대표 먼저 → `display_order ASC, created_at ASC` (FR-021)

### TechStackItem (`tech_stack` 테이블)

| 필드 | 타입 | 필수 | 설명 |
|------|------|:---:|------|
| `id` | uuid (PK) | 자동 | |
| `name` | text | ✅ | 기술 이름. 공백만은 불가 |
| `category` | text | — | `'Language'·'Backend'·'Frontend'·'Infra'·'Tool'` CHECK, NULL 허용(미분류→`Tool` 선반에 표시) |
| `color` | text | — | 책등 색 hex (기본 `'#7f9aa6'`) — 명세 001 책장 시각 유지용 |
| `display_order` | int | — | 수동 순서 |
| `created_at` | timestamptz | 자동 | |

### Admin Account / Session

Supabase Auth가 관리 (`auth.users`) — 자체 테이블 없음. 계정 1개 수동
프로비저닝, 가입 비활성화. 세션은 supabase-js 기본 정책(localStorage 보관,
자동 갱신, 로그아웃 시 파기).

## 프론트엔드 도메인 타입 (`src/data/types.ts`)

```ts
type ProjectStatus = 'current' | 'completed' | 'planned'

interface ProjectRecord {
  id: string
  title: string
  tagline: string | null
  description: string          // 마크다운
  status: ProjectStatus
  stack: string[]
  links: { label: string; href: string; disabled?: boolean }[]
  displayOrder: number | null
  createdAt: string            // ISO
  images: ProjectImageRecord[] // 갤러리 정렬 완료 상태로 제공
}

interface ProjectImageRecord {
  id: string
  url: string                  // 공개 URL (storage_path에서 파생)
  isCover: boolean
}

interface TechStackRecord {
  id: string
  name: string
  category: 'Language' | 'Backend' | 'Frontend' | 'Infra' | 'Tool' | null
  color: string
  displayOrder: number | null
}

interface RoomContent {
  laptopProjects: ProjectRecord[]   // current+completed, 정렬 완료
  plannedProjects: ProjectRecord[]  // planned, 정렬 완료
  techStack: TechStackRecord[]
  source: 'remote' | 'cache' | 'static'  // 폴백 단계 추적 (UI 비노출)
}
```

## 검증 규칙 (관리자 폼)

| 대상 | 규칙 | 실패 시 |
|------|------|---------|
| 제목/설명/이름 | trim 후 1자 이상 | 필드별 누락 안내 (FR-010) |
| 상태 | 3값 중 하나 | 선택 UI로 원천 차단 |
| 이미지 파일 | MIME ∈ {png,jpeg,webp,gif} AND 크기 ≤ 5MB | 허용 형식·용량 안내 (FR-013) |
| 이미지 수 | 프로젝트당 ≤ 10장 | 초과 시 업로드 거부 안내 |
| 링크 | href 비어 있으면 항목 제외 | — |

## 캐시 모델 (`localStorage`)

- 키: `oor-content-cache-v1`
- 값: `{ savedAt: string, content: RoomContent }` (source 제외 직렬화)
- 쓰기: 원격 로드 성공 시마다 덮어쓰기
- 읽기: 원격 실패 시. JSON 파싱 실패 → 키 삭제 후 정적 폴백
