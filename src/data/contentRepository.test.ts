import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchRoomContent } from './contentRepository'

type QueryResult = { data: unknown; error: { message: string } | null }

/** 읽기 전용 쿼리 스텁 — 실제 응답 구조(data/error)를 완전한 형태로 재현 */
function createReadStub(results: Record<string, QueryResult>) {
  const client = {
    from: vi.fn((table: string) => {
      const result = results[table] ?? { data: null, error: { message: `no stub for ${table}` } }
      const q: Record<string, unknown> = {}
      for (const m of ['select', 'order', 'eq']) {
        q[m] = vi.fn(() => q)
      }
      q.then = (resolve: (v: QueryResult) => void, reject: (e: unknown) => void) => {
        Promise.resolve(result).then(resolve, reject)
      }
      return q
    }),
    storage: {
      from: vi.fn(() => ({
        getPublicUrl: vi.fn((path: string) => ({
          data: { publicUrl: `https://cdn.test/${path}` },
        })),
      })),
    },
  }
  return client as unknown as SupabaseClient
}

const projectRows = [
  {
    id: 'done-1',
    title: '완성 프로젝트',
    description: '완성 설명',
    status: 'completed',
    tagline: null,
    stack: [],
    links: [],
    display_order: null,
    created_at: '2026-06-01T00:00:00.000Z',
    updated_at: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'cur-1',
    title: '진행 중 프로젝트',
    description: '진행 설명',
    status: 'current',
    tagline: '한 줄',
    stack: ['React'],
    links: [{ label: 'GitHub', href: 'https://github.com/x' }],
    display_order: null,
    created_at: '2026-05-01T00:00:00.000Z',
    updated_at: '2026-05-01T00:00:00.000Z',
  },
  {
    id: 'plan-1',
    title: '예정 프로젝트',
    description: '예정 설명',
    status: 'planned',
    tagline: null,
    stack: [],
    links: [],
    display_order: null,
    created_at: '2026-04-01T00:00:00.000Z',
    updated_at: '2026-04-01T00:00:00.000Z',
  },
]

const imageRows = [
  {
    id: 'img-plain',
    project_id: 'cur-1',
    storage_path: 'projects/cur-1/plain.png',
    display_order: 0,
    is_cover: false,
    created_at: '2026-05-01T00:00:00.000Z',
  },
  {
    id: 'img-cover',
    project_id: 'cur-1',
    storage_path: 'projects/cur-1/cover.png',
    display_order: 1,
    is_cover: true,
    created_at: '2026-05-02T00:00:00.000Z',
  },
]

const techRows = [
  {
    id: 't1',
    name: 'Java',
    category: 'Language',
    color: '#e76f51',
    display_order: null,
    created_at: '2026-01-01T00:00:00.000Z',
  },
]

const categoryRows = [
  { id: 'c2', name: 'Backend', display_order: 2, created_at: '2026-01-01T00:00:00.000Z' },
  { id: 'c1', name: 'Language', display_order: 1, created_at: '2026-01-01T00:00:00.000Z' },
]

describe('contentRepository.fetchRoomContent — FR-016', () => {
  test('네 테이블을 RoomContent로 매핑한다 (정렬·URL 파생·source: remote)', async () => {
    const client = createReadStub({
      projects: { data: projectRows, error: null },
      project_images: { data: imageRows, error: null },
      tech_stack: { data: techRows, error: null },
      tech_categories: { data: categoryRows, error: null },
    })

    const content = await fetchRoomContent(client)

    expect(content.source).toBe('remote')
    // 진행 중이 완성보다 먼저 (FR-017)
    expect(content.laptopProjects.map((p) => p.id)).toEqual(['cur-1', 'done-1'])
    // 예정은 화이트보드로 (FR-016)
    expect(content.plannedProjects.map((p) => p.id)).toEqual(['plan-1'])
    // 갤러리는 대표 우선 + 공개 URL 파생 (FR-021)
    expect(content.laptopProjects[0].images.map((i) => i.id)).toEqual([
      'img-cover',
      'img-plain',
    ])
    expect(content.laptopProjects[0].images[0].url).toBe(
      'https://cdn.test/projects/cur-1/cover.png',
    )
    // 기술 스택 매핑
    expect(content.techStack).toEqual([
      { id: 't1', name: 'Java', category: 'Language', color: '#e76f51', displayOrder: null },
    ])
    // 선반은 display_order 오름차순
    expect(content.techCategories).toEqual([
      { id: 'c1', name: 'Language', displayOrder: 1 },
      { id: 'c2', name: 'Backend', displayOrder: 2 },
    ])
  })

  test('조회 실패 시 reject된다 (폴백은 ContentContext 책임)', async () => {
    const client = createReadStub({
      projects: { data: null, error: { message: 'down' } },
      project_images: { data: [], error: null },
      tech_stack: { data: [], error: null },
      tech_categories: { data: [], error: null },
    })

    await expect(fetchRoomContent(client)).rejects.toThrow()
  })
})
