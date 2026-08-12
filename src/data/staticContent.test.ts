import { staticRoomContent } from './staticContent'

describe('staticContent — FR-018 ②단계 (정적 폴백 어댑터)', () => {
  test('source가 static이다', () => {
    expect(staticRoomContent().source).toBe('static')
  })

  test('기존 대표 프로젝트가 진행 중 상태로 노트북 목록에 매핑된다', () => {
    const { laptopProjects } = staticRoomContent()
    expect(laptopProjects.length).toBeGreaterThan(0)
    expect(laptopProjects[0].title).toBe('Melolist-v3')
    expect(laptopProjects[0].status).toBe('current')
  })

  test('Melolist 항목이 신규 콘텐츠(허밍 검색·핵심 성과)로 매핑된다', () => {
    const project = staticRoomContent().laptopProjects[0]
    expect(project.tagline).toBe('허밍으로 찾는 음악 검색 서비스')
    expect(project.description).toContain('### 핵심 성과 — 측정으로 검증')
    expect(project.description).toContain('- 지문(원음) 인식률')
    expect(project.stack).toEqual([
      'React 19',
      'TypeScript',
      'Spring Boot 3.5',
      'Supabase',
      'ACRCloud',
      'OpenAI',
    ])
  })

  test('기존 예정 프로젝트가 planned 상태로 매핑된다', () => {
    const { plannedProjects } = staticRoomContent()
    expect(plannedProjects[0].title).toBe('당구 플랫폼')
    expect(plannedProjects[0].status).toBe('planned')
  })

  test('기술 스택이 색상·분류와 함께 매핑된다', () => {
    const { techStack } = staticRoomContent()
    const java = techStack.find((t) => t.name === 'Java')
    expect(java).toMatchObject({ category: 'Language', color: '#e76f51' })
    expect(techStack.length).toBeGreaterThanOrEqual(15)
  })
})
