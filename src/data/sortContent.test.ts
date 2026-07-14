import { compareGalleryRows, sortPlannedProjects, sortProjectsForLaptop } from './sortContent'
import { buildProject } from '../test/fakes'

describe('sortProjectsForLaptop — FR-017', () => {
  test('진행 중 그룹이 앞에 오고, 그룹 내 수동 순서 → 최신순으로 정렬하며 예정은 제외한다', () => {
    const currentOrdered = buildProject({
      title: 'A1',
      status: 'current',
      displayOrder: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
    })
    const currentNewer = buildProject({
      title: 'A2',
      status: 'current',
      displayOrder: null,
      createdAt: '2026-06-01T00:00:00.000Z',
    })
    const currentOlder = buildProject({
      title: 'A3',
      status: 'current',
      displayOrder: null,
      createdAt: '2026-05-01T00:00:00.000Z',
    })
    const completed = buildProject({
      title: 'B1',
      status: 'completed',
      displayOrder: null,
      createdAt: '2026-06-30T00:00:00.000Z',
    })
    const planned = buildProject({ title: 'X', status: 'planned' })

    const sorted = sortProjectsForLaptop([
      completed,
      currentNewer,
      planned,
      currentOlder,
      currentOrdered,
    ])

    expect(sorted.map((p) => p.title)).toEqual(['A1', 'A2', 'A3', 'B1'])
  })
})

describe('sortPlannedProjects', () => {
  test('예정 프로젝트만 수동 순서 → 최신순으로 정렬한다', () => {
    const p1 = buildProject({
      title: 'P1',
      status: 'planned',
      displayOrder: 2,
      createdAt: '2026-01-01T00:00:00.000Z',
    })
    const p2 = buildProject({
      title: 'P2',
      status: 'planned',
      displayOrder: null,
      createdAt: '2026-03-01T00:00:00.000Z',
    })
    const current = buildProject({ title: 'C', status: 'current' })

    expect(sortPlannedProjects([p2, current, p1]).map((p) => p.title)).toEqual(['P1', 'P2'])
  })
})

describe('compareGalleryRows — FR-021', () => {
  test('대표 우선 → display_order → created_at 순으로 정렬한다', () => {
    const rows = [
      { id: 'b', is_cover: false, display_order: 0, created_at: '2026-01-02T00:00:00.000Z' },
      { id: 'cover', is_cover: true, display_order: 9, created_at: '2026-01-03T00:00:00.000Z' },
      { id: 'a', is_cover: false, display_order: 0, created_at: '2026-01-01T00:00:00.000Z' },
      { id: 'c', is_cover: false, display_order: 1, created_at: '2026-01-01T00:00:00.000Z' },
    ]

    expect([...rows].sort(compareGalleryRows).map((r) => r.id)).toEqual([
      'cover',
      'a',
      'b',
      'c',
    ])
  })
})
