# Contract: 레포지토리 인터페이스

supabase-js 접점은 아래 두 모듈로만 한정한다 (헌법 원칙 II — 테스트에서는
이 인터페이스의 fake 구현을 주입).

## ContentRepository (`src/data/contentRepository.ts`) — 방문자 read

```ts
/** 원격 콘텐츠 전체 로드. 실패 시 reject — 폴백은 ContentContext 책임. */
export function fetchRoomContent(): Promise<RoomContent>  // source: 'remote'
```

- projects / project_images / tech_stack 3회 조회 후 도메인 타입으로 매핑
- 정렬 규칙 적용: 상태 그룹(진행 중→완성) → `display_order ASC NULLS LAST,
  created_at DESC`; 갤러리는 대표 먼저
- `storage_path` → 공개 URL 변환 포함

## ContentCache (`src/data/contentCache.ts`)

```ts
export function saveContentCache(content: RoomContent): void
export function loadContentCache(): RoomContent | null   // source: 'cache'
```

- 파싱 실패·스키마 불일치 시 null 반환 + 캐시 키 제거

## StaticFallback (`src/data/staticContent.ts`)

```ts
export function staticRoomContent(): RoomContent          // source: 'static'
```

- 기존 `content.ts` 데이터를 도메인 타입으로 변환 (highlights → 마크다운 목록)

## AdminRepository (`src/admin/adminRepository.ts`) — 관리자 CRUD

```ts
export interface AdminRepository {
  // 인증 (FR-002~005)
  signIn(email: string, password: string): Promise<void>   // 실패: AuthError
  signOut(): Promise<void>
  getSession(): Promise<{ email: string } | null>
  onSessionChange(cb: (session: { email: string } | null) => void): () => void

  // 프로젝트 CRUD (FR-006~011)
  listProjects(): Promise<ProjectRecord[]>                  // 전체, 관리자 목록용
  createProject(input: ProjectInput): Promise<ProjectRecord>
  updateProject(id: string, input: ProjectInput): Promise<ProjectRecord>
  deleteProject(id: string): Promise<void>                  // 연결 이미지 Storage 정리 포함

  // 이미지 (FR-012~015)
  uploadImage(projectId: string, file: File): Promise<ProjectImageRecord>
  deleteImage(imageId: string): Promise<void>
  setCoverImage(projectId: string, imageId: string): Promise<void>  // 기존 대표 해제 포함

  // 기술 스택 (FR-020)
  listTech(): Promise<TechStackRecord[]>
  createTech(input: TechInput): Promise<TechStackRecord>
  updateTech(id: string, input: TechInput): Promise<TechStackRecord>
  deleteTech(id: string): Promise<void>
}

export interface ProjectInput {
  title: string
  description: string
  status: ProjectStatus
  tagline?: string | null
  stack?: string[]
  links?: { label: string; href: string; disabled?: boolean }[]
  displayOrder?: number | null
}

export interface TechInput {
  name: string
  category?: TechStackRecord['category']
  color?: string
  displayOrder?: number | null
}
```

**오류 계약**: 모든 메서드는 실패 시 `Error`(메시지는 사용자 표시용 아님)를
throw. UI 계층이 일반 메시지로 치환한다 — 로그인 실패는 항상 "이메일 또는
비밀번호가 올바르지 않습니다" (FR-004).

## 순수 함수 계약 (모킹 없이 테스트)

```ts
// src/admin/imageValidation.ts (FR-013)
export function validateImageFile(
  file: { type: string; size: number },
  currentCount: number,
): { ok: true } | { ok: false; reason: 'type' | 'size' | 'count' }

// src/data/sortContent.ts (FR-017, FR-021)
export function sortProjectsForLaptop(projects: ProjectRecord[]): ProjectRecord[]
export function sortGallery(images: RawImageRow[]): RawImageRow[]
```

## UI 계약

- 방문자: `ContentProvider`가 `RoomContent`를 context로 제공.
  `InformationPanel`은 context만 소비 (직접 import 제거).
- 관리자: `AdminApp`이 `AdminRepository`를 prop/context로 주입받아 하위
  컴포넌트에 전달 — 테스트에서 fake 주입 지점.
