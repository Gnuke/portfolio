/**
 * 도메인 타입 — specs/002-admin-project-cms/data-model.md 의 정의를 따른다.
 */

export type ProjectStatus = 'current' | 'completed' | 'planned'

export interface ProjectLinkRecord {
  label: string
  href: string
  disabled?: boolean
}

export interface ProjectImageRecord {
  id: string
  /** Storage 공개 URL */
  url: string
  isCover: boolean
}

export interface ProjectRecord {
  id: string
  title: string
  tagline: string | null
  /** 마크다운 본문 */
  description: string
  status: ProjectStatus
  stack: string[]
  links: ProjectLinkRecord[]
  displayOrder: number | null
  /** ISO 8601 */
  createdAt: string
  /** 갤러리 정렬(대표 우선) 완료 상태 */
  images: ProjectImageRecord[]
}

export type TechCategory = 'Language' | 'Backend' | 'Frontend' | 'Database' | 'Infra' | 'Tool'

export interface TechStackRecord {
  id: string
  name: string
  category: TechCategory | null
  color: string
  displayOrder: number | null
}

/** 폴백 단계 추적용 — UI에는 노출하지 않는다 (FR-018 조용한 폴백) */
export type ContentSource = 'remote' | 'cache' | 'static'

export interface RoomContent {
  /** 노트북: 진행 중 → 완성 순 정렬 완료 */
  laptopProjects: ProjectRecord[]
  /** 화이트보드: 예정 */
  plannedProjects: ProjectRecord[]
  /** 책장 */
  techStack: TechStackRecord[]
  source: ContentSource
}
