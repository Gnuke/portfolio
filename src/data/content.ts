/**
 * ============================================================================
 *  Only-One Room — 콘텐츠 데이터 (여기만 수정하면 방 안의 내용이 바뀝니다)
 * ============================================================================
 *  - profile        : 방 주인 정보 (인트로 인사말 / 이름표에 사용)
 *  - currentProject : 노트북에 표시되는 현재 진행 중인 대표 프로젝트
 *  - techStack      : 책장에 꽂힌 기술 스택
 *  - futureProjects : 화이트보드에 붙는 개발 예정 프로젝트
 * ============================================================================
 */

export interface Profile {
  name: string
  role: string
  greeting: string
  links: { label: string; href: string }[]
}

export interface ProjectLink {
  label: string
  href: string
  disabled?: boolean // 아직 공개 전이면 true → "준비 중" 표시
}

export interface Project {
  id: string
  name: string
  tagline: string
  period: string
  status: string
  description: string
  highlights: string[]
  stack: string[]
  links: ProjectLink[]
}

export interface Tech {
  name: string
  /** 책 표지 색상 (기술 브랜드 컬러 계열) */
  color: string
  category: 'Language' | 'Backend' | 'Frontend' | 'Infra' | 'Tool'
}

export interface FutureProject {
  title: string
  description: string
  /** 상태 배지 문구 (미구현 UX) */
  badge: 'Work in Progress' | 'Idea' | 'Planned'
}

// ── 방 주인 정보 ────────────────────────────────────────────────────────────
export const profile: Profile = {
  name: '정진욱 · Gnuke',
  role: 'Developer',
  greeting: '안녕하세요. 정진욱입니다.',
  links: [{ label: 'GitHub', href: 'https://github.com/Gnuke' }],
}

// ── 노트북: 현재 진행 중인 대표 프로젝트 (MVP는 1개만 표시) ──────────────────
// 향후 프로젝트가 늘어나면 배열에 추가 → 모니터 내 좌우 슬라이드로 확장 예정.
export const currentProjects: Project[] = [
  {
    id: 'melolist-v3',
    name: 'Melolist-v3',
    tagline: '다양한 방식으로 음악을 검색하는 서비스',
    period: '',
    status: '마이그레이션 진행 중',
    description:
      '음악의 메타데이터가 잘 기억나지 않을 때에도 음성인식을 통해 데이터 없이 곡을 찾을 수 있도록 하고, ' +
      '이를 기반으로 더 공정한 음원차트 랭킹 시스템을 도입하기 위해 개발 중인 서비스입니다.',
    highlights: [
      '음성인식 기반 검색 — 메타데이터 없이도 곡을 탐색',
      '더 공정한 음원차트 랭킹 시스템 도입',
      'React Native · Spring Boot 3.5 마이그레이션 진행 중',
    ],
    stack: ['React Native', 'JDK 21', 'Spring Boot 3.5', 'Spring AI (예정)'],
    links: [
      { label: 'GitHub', href: 'https://github.com/Gnuke', disabled: false },
      { label: 'Live Demo', href: '#', disabled: true },
    ],
  },
]

// ── 책장: 사용 가능한 기술 스택 ──────────────────────────────────────────────
export const techStack: Tech[] = [
  { name: 'Java', color: '#e76f51', category: 'Language' },
  { name: 'Python', color: '#4b8bbe', category: 'Language' },
  { name: 'JavaScript', color: '#e0c341', category: 'Language' },
  { name: 'Spring Boot', color: '#6aa84f', category: 'Backend' },
  { name: 'JPA', color: '#7f9aa6', category: 'Backend' },
  { name: 'React', color: '#4aa8c0', category: 'Frontend' },
  { name: 'Vue.js', color: '#42b883', category: 'Frontend' },
  { name: 'Next.js', color: '#5b6472', category: 'Frontend' },
  { name: 'Nuxt.js', color: '#35b98a', category: 'Frontend' },
  { name: 'MariaDB', color: '#a86b4c', category: 'Backend' },
  { name: 'MySQL', color: '#4d7f9c', category: 'Backend' },
  { name: 'PostgreSQL', color: '#4a6fa5', category: 'Backend' },
  { name: 'Redis', color: '#d1603a', category: 'Backend' },
  { name: 'AWS', color: '#e2933a', category: 'Infra' },
  { name: 'Docker', color: '#4d84c4', category: 'Infra' },
]

// ── 화이트보드: 개발 예정 프로젝트 ───────────────────────────────────────────
export const futureProjects: FutureProject[] = [
  {
    title: '당구 플랫폼',
    description: '당구를 주제로 구상 중인 사이드 프로젝트입니다. (미구현)',
    badge: 'Idea',
  },
]
