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

  test('기존 하이라이트가 설명 마크다운 목록으로 합쳐진다', () => {
    const project = staticRoomContent().laptopProjects[0]
    expect(project.description).toContain('- 음성인식 기반 검색')
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
