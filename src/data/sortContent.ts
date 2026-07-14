import type { ProjectRecord } from './types'

export interface GalleryRowOrder {
  is_cover: boolean
  display_order: number
  created_at: string
}

/** 수동 표시 순서 우선(NULLS LAST), 없으면 최신 등록순 (Clarifications 확정) */
function compareManualThenNewest(a: ProjectRecord, b: ProjectRecord): number {
  if (a.displayOrder != null && b.displayOrder != null && a.displayOrder !== b.displayOrder) {
    return a.displayOrder - b.displayOrder
  }
  if (a.displayOrder != null && b.displayOrder == null) return -1
  if (a.displayOrder == null && b.displayOrder != null) return 1
  return b.createdAt.localeCompare(a.createdAt)
}

/** FR-017: 노트북 = 진행 중 그룹 → 완성 그룹, 그룹 내 수동 순서 → 최신순 */
export function sortProjectsForLaptop(projects: ProjectRecord[]): ProjectRecord[] {
  const group = (status: ProjectRecord['status']) =>
    projects.filter((p) => p.status === status).sort(compareManualThenNewest)
  return [...group('current'), ...group('completed')]
}

/** 화이트보드 = 예정만, 동일 정렬 규칙 */
export function sortPlannedProjects(projects: ProjectRecord[]): ProjectRecord[] {
  return projects.filter((p) => p.status === 'planned').sort(compareManualThenNewest)
}

/** FR-021: 대표 우선 → display_order → created_at */
export function compareGalleryRows(a: GalleryRowOrder, b: GalleryRowOrder): number {
  return (
    Number(b.is_cover) - Number(a.is_cover) ||
    a.display_order - b.display_order ||
    a.created_at.localeCompare(b.created_at)
  )
}
