/**
 * ============================================================================
 *  Gnuke's Portfolio — 콘텐츠 데이터 (여기만 수정하면 방 안의 내용이 바뀝니다)
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
  category: string
}

/** 책장 선반 순서 — 원격(tech_categories) 폴백용 기본값 */
export const techCategories: string[] = [
  'Language',
  'Backend',
  'Frontend',
  'Database',
  'Infra',
  'Tool',
]

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
    tagline: '허밍으로 찾는 음악 검색 서비스',
    period: '2026.07 –',
    status: '운영 중',
    // 원격(Supabase projects.description)과 동일한 마크다운 — 렌더러 제약상 표·HTML 금지
    description: `## 소개

주변에 흐르는 음악을 들려주거나 기억나는 멜로디를 흥얼거리면 곡을 찾아주고,
찾은 곡을 즐겨찾기·플레이리스트로 관리하는 음악 검색 서비스입니다.

2026.07 – 현재 운영 중 · **1인 개발** (기획 · 디자인 · 개발 · 배포 · 운영)

### 핵심 성과 — 측정으로 검증

- 지문(원음) 인식률 **96.7%** · 허밍 **70%** — 직접 녹음한 클립 50개 전수 실측
- 검색 응답 p95 **12.4초 → 5.3초** — 운영 이벤트 로그 기반 측정, 목표(6초) 달성
- AI 폴백 검색 리콜 **80% → 약 96%** — 실쿼리 세트 재현 측정
- 자동화 테스트 **175건**(백엔드 135 · 프론트 40) · 기능 단위 PR **44건** 병합

### 아키텍처 — 3단 폴백 검색 파이프라인

1차 인식 실패가 곧 "결과 없음"이 되지 않도록 실측 데이터에 근거해 폴백 계층을 설계했습니다.

1. **ACRCloud 지문/허밍 인식** — YouTube 메타 보강 3초 데드라인, DB 저장은 응답 경로 밖 비동기
2. **AI 자연어 폴백** — 기억나는 가사·분위기로 검색. 2회 병렬 샘플링 + 곡 카탈로그 대조 검증으로 LLM 환각 차단
3. **웹검색 심층 탐색** — 확인 안 된 후보는 "미확인" 배지로 정직하게 라벨링, 1일 쿼터 관리

### 문제 해결 하이라이트

- **p95 12.4초 → 5.3초**: 구간별 타이밍 계측으로 병목 분해 — 곡 DB 저장 비동기 분리, 메타 보강 데드라인 적용
- **AI 폴백 품질**: 환각·한/영 표기 혼재·동명이곡을 카탈로그 대조 검증 + 한/영/로마자 3단 교차 대조로 해결
- **인식률 병목 규명**: 50클립 실측으로 병목이 녹음 품질이 아닌 인식 엔진의 K-곡 허밍 커버리지임을 실증 → 폴백 계층 설계의 근거
- **UX 디테일**: 테마 전환 깜빡임(FOUC) 차단, 무음(RMS) 사전 가드, 게스트 인라인 로그인 유도

### 운영 방식

- 전 구간 이벤트 로그 계측 → 지표 SQL · 어드민 대시보드로 "측정 → 개선 → 재측정" 루프
- spec-kit 문서 주도 개발 · GitHub Actions CI · Render/Supabase 무료 티어 제약 대응`,
    highlights: [],
    stack: ['React 19', 'TypeScript', 'Spring Boot 3.5', 'Supabase', 'ACRCloud', 'OpenAI'],
    links: [
      { label: 'GitHub', href: 'https://github.com/Gnuke/Melolist-v3', disabled: false },
      { label: '서비스', href: 'https://melolist-v3.vercel.app', disabled: false },
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
  { name: 'MariaDB', color: '#a86b4c', category: 'Database' },
  { name: 'MySQL', color: '#4d7f9c', category: 'Database' },
  { name: 'PostgreSQL', color: '#4a6fa5', category: 'Database' },
  { name: 'Redis', color: '#d1603a', category: 'Database' },
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
