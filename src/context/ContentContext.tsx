import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loadContentCache, saveContentCache } from '../data/contentCache'
import { fetchRoomContent } from '../data/contentRepository'
import { staticRoomContent } from '../data/staticContent'
import type { RoomContent } from '../data/types'

export interface ContentSources {
  fetchRemote: () => Promise<RoomContent>
  loadCache: () => RoomContent | null
  saveCache: (content: RoomContent) => void
  loadStatic: () => RoomContent
}

const defaultSources: ContentSources = {
  fetchRemote: () => fetchRoomContent(),
  loadCache: loadContentCache,
  saveCache: saveContentCache,
  loadStatic: staticRoomContent,
}

export const ContentContext = createContext<RoomContent | null>(null)

export function useRoomContent(): RoomContent {
  const content = useContext(ContentContext)
  if (!content) {
    throw new Error('useRoomContent는 ContentProvider 안에서만 사용할 수 있습니다.')
  }
  return content
}

/**
 * FR-018 폴백 체인: 초기값 = 캐시 ?? 정적 → 원격 성공 시 교체+캐시 갱신,
 * 실패 시 그대로(조용히). 어떤 경로에도 빈 화면·장애 안내가 없다.
 */
export function ContentProvider({
  children,
  sources,
}: {
  children: ReactNode
  sources?: Partial<ContentSources>
}) {
  const resolved = useMemo(() => ({ ...defaultSources, ...sources }), [sources])
  const [content, setContent] = useState<RoomContent>(
    () => resolved.loadCache() ?? resolved.loadStatic(),
  )

  useEffect(() => {
    let alive = true
    resolved
      .fetchRemote()
      .then((remote) => {
        if (!alive) return
        setContent(remote)
        resolved.saveCache(remote)
      })
      .catch(() => {
        // 조용한 폴백 — 이미 캐시/정적 콘텐츠가 표시 중 (FR-018)
      })
    return () => {
      alive = false
    }
  }, [resolved])

  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>
}
