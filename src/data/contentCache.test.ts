import { CACHE_KEY, loadContentCache, saveContentCache } from './contentCache'
import { buildProject, buildRoomContent, buildTech } from '../test/fakes'

describe('contentCache — FR-018 ①단계', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('저장 후 불러오면 동일 콘텐츠가 source: cache 로 돌아온다', () => {
    const content = buildRoomContent({
      laptopProjects: [buildProject({ title: '캐시된 프로젝트' })],
      source: 'remote',
    })

    saveContentCache(content)
    const loaded = loadContentCache()

    expect(loaded).not.toBeNull()
    expect(loaded?.source).toBe('cache')
    expect(loaded?.laptopProjects[0]?.title).toBe('캐시된 프로젝트')
  })

  test('기술 스택(책장)도 캐시 왕복에 포함된다', () => {
    const content = buildRoomContent({
      techStack: [buildTech({ name: 'Python', category: 'Language' })],
      source: 'remote',
    })

    saveContentCache(content)
    const loaded = loadContentCache()

    expect(loaded?.techStack).toHaveLength(1)
    expect(loaded?.techStack[0]).toMatchObject({ name: 'Python', category: 'Language' })
  })

  test('캐시가 없으면 null을 반환한다', () => {
    expect(loadContentCache()).toBeNull()
  })

  test('손상된 JSON이면 null을 반환하고 캐시 키를 제거한다', () => {
    localStorage.setItem(CACHE_KEY, '{corrupted json')
    expect(loadContentCache()).toBeNull()
    expect(localStorage.getItem(CACHE_KEY)).toBeNull()
  })

  test('스키마가 맞지 않으면 null을 반환하고 캐시 키를 제거한다', () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ foo: 'bar' }))
    expect(loadContentCache()).toBeNull()
    expect(localStorage.getItem(CACHE_KEY)).toBeNull()
  })
})
