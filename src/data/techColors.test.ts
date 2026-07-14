import { SPINE_PALETTE, techColorFor } from './techColors'

describe('techColorFor', () => {
  test('같은 이름은 항상 같은 색을 돌려준다', () => {
    expect(techColorFor('어떤낯선기술')).toBe(techColorFor('어떤낯선기술'))
    expect(techColorFor('Svelte')).toBe(techColorFor('Svelte'))
  })

  test('대소문자·공백·구두점이 달라도 같은 기술이면 같은 색이다', () => {
    expect(techColorFor('Fast API')).toBe(techColorFor('fastapi'))
    expect(techColorFor('Vue.js')).toBe(techColorFor('vue'))
    expect(techColorFor('Node.js')).toBe(techColorFor('NodeJS'))
  })

  test('기존 시드 색과 동일한 브랜드 색을 유지한다', () => {
    expect(techColorFor('Java')).toBe('#e76f51')
    expect(techColorFor('Spring Boot')).toBe('#6aa84f')
    expect(techColorFor('React')).toBe('#4aa8c0')
  })

  test('알려진 기술은 브랜드를 연상시키는 고유 색을 받는다', () => {
    expect(techColorFor('IntelliJ')).toBe('#b0568a')
    expect(techColorFor('Grafana')).toBe('#d97f38')
    expect(techColorFor('Claude')).toBe('#cc785c')
  })

  test('모르는 기술은 책등 팔레트 안에서 색을 받는다', () => {
    expect(SPINE_PALETTE).toContain(techColorFor('사내전용프레임워크'))
    expect(SPINE_PALETTE).toContain(techColorFor('Zig'))
  })

  test('어떤 이름도 기본 회색(#7f9aa6)을 받지 않는다', () => {
    const samples = ['JPA', 'Docker', 'Zig', 'Elixir', '한글기술', 'x']
    for (const name of samples) {
      expect(techColorFor(name)).not.toBe('#7f9aa6')
    }
  })

  test('책등 팔레트는 중복 없는 6자리 hex 색으로만 구성된다', () => {
    for (const hex of SPINE_PALETTE) {
      expect(hex).toMatch(/^#[0-9a-f]{6}$/)
    }
    expect(new Set(SPINE_PALETTE).size).toBe(SPINE_PALETTE.length)
  })
})
