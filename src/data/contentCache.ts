import type { RoomContent } from './types'

export const CACHE_KEY = 'oor-content-cache-v1'

interface CachePayload {
  savedAt: string
  content: Omit<RoomContent, 'source'>
}

/** 원격 로드 성공 시마다 스냅샷 저장 (FR-018) */
export function saveContentCache(content: RoomContent): void {
  try {
    const { source: _source, ...rest } = content
    const payload: CachePayload = { savedAt: new Date().toISOString(), content: rest }
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch {
    // 저장 실패(쿼터 초과 등)는 치명적이지 않다 — 다음 성공 로드에서 재시도
  }
}

/** 원격 실패 시 마지막 성공 스냅샷. 손상·불일치 시 키 제거 후 null. */
export function loadContentCache(): RoomContent | null {
  const raw = localStorage.getItem(CACHE_KEY)
  if (raw == null) return null
  try {
    const parsed = JSON.parse(raw) as Partial<CachePayload>
    const content = parsed.content
    if (
      !content ||
      !Array.isArray(content.laptopProjects) ||
      !Array.isArray(content.plannedProjects) ||
      !Array.isArray(content.techStack) ||
      !Array.isArray(content.techCategories)
    ) {
      throw new Error('cache schema mismatch')
    }
    return {
      laptopProjects: content.laptopProjects,
      plannedProjects: content.plannedProjects,
      techStack: content.techStack,
      techCategories: content.techCategories,
      source: 'cache',
    }
  } catch {
    localStorage.removeItem(CACHE_KEY)
    return null
  }
}
