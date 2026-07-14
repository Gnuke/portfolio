/**
 * 책장 책등(spine) 색 시스템.
 *
 * 다양하되 정신없지 않게: 색상(hue)만 다양하게 쓰고 채도 40~55%·명도 45~55%
 * 밴드에 맞춰 방의 따뜻한 톤과 한 세트로 읽히게 한다. 알려진 기술은 그 기술을
 * 연상시키는 색을, 모르는 기술은 이름 해시로 책등 팔레트에서 결정적으로 받는다.
 */

/** 이름 비교용 정규화 — 대소문자·공백·구두점 차이를 무시한다. */
function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9가-힣]/g, '')
}

/** 알려진 기술의 브랜드 연상색 (정규화된 이름 → hex). 시드 색과 동일 유지. */
const KNOWN_COLORS: Record<string, string> = {
  // Language
  java: '#e76f51',
  python: '#4b8bbe',
  javascript: '#e0c341',
  typescript: '#4a7ab5',
  kotlin: '#7e62c9',
  // Backend
  springboot: '#6aa84f',
  spring: '#6aa84f',
  jpa: '#9c8347',
  nodejs: '#557a52',
  node: '#557a52',
  fastapi: '#3f9a8a',
  mariadb: '#a86b4c',
  mysql: '#4d7f9c',
  postgresql: '#4a6fa5',
  postgres: '#4a6fa5',
  oracle: '#c14438',
  redis: '#d1603a',
  // Frontend
  react: '#4aa8c0',
  vuejs: '#42b883',
  vue: '#42b883',
  nextjs: '#5b6472',
  nuxtjs: '#2e8b6a',
  nuxt: '#2e8b6a',
  // Infra
  aws: '#e2933a',
  docker: '#4d84c4',
  kubernetes: '#5a6fc0',
  k8s: '#5a6fc0',
  nginx: '#4e9151',
  jenkins: '#8f6b4e',
  // Tool
  git: '#c25a44',
  eclipse: '#4a5a94',
  intellij: '#b0568a',
  vscode: '#4c7dbf',
  visualstudiocode: '#4c7dbf',
  grafana: '#d97f38',
  dynatrace: '#8156b8',
  maxgauge: '#b04a55',
  gpt: '#379e86',
  chatgpt: '#379e86',
  openai: '#379e86',
  claude: '#cc785c',
  anthropic: '#cc785c',
}

/** 모르는 기술이 받는 책등 팔레트 — 색상환을 고르게 돌며 같은 톤 밴드를 지킨다. */
export const SPINE_PALETTE: readonly string[] = [
  '#b0564d', // 벽돌
  '#c9863d', // 오커
  '#a3913f', // 올리브 골드
  '#6f9e51', // 이끼
  '#3f9a7a', // 청록
  '#4b93ad', // 물빛
  '#5577b5', // 슬레이트 블루
  '#7466b3', // 제비꽃
  '#a05f9c', // 자두
  '#b25573', // 로즈
]

/** djb2 — 렌더마다 흔들리지 않는 결정적 해시. */
function hashName(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  }
  return h
}

/** 기술 이름에 어울리는 책등 색을 돌려준다. */
export function techColorFor(name: string): string {
  const key = normalize(name)
  return KNOWN_COLORS[key] ?? SPINE_PALETTE[hashName(key) % SPINE_PALETTE.length]
}
