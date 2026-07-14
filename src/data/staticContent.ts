import {
  currentProjects,
  futureProjects,
  techStack,
  type FutureProject,
  type Project,
} from './content'
import type { ProjectRecord, RoomContent, TechStackRecord } from './types'

/** 정적 데이터의 기준 시점 — PRD 작성일 */
const STATIC_EPOCH = '2026-07-06T00:00:00.000Z'

function toDescription(p: Project): string {
  const parts = [p.description]
  if (p.highlights.length > 0) {
    parts.push('### 주요 작업', p.highlights.map((h) => `- ${h}`).join('\n'))
  }
  return parts.join('\n\n')
}

function mapCurrent(p: Project, index: number): ProjectRecord {
  return {
    id: `static-${p.id}`,
    title: p.name,
    tagline: p.tagline || null,
    description: toDescription(p),
    status: 'current',
    stack: p.stack,
    links: p.links,
    displayOrder: index,
    createdAt: STATIC_EPOCH,
    images: [],
  }
}

function mapFuture(f: FutureProject, index: number): ProjectRecord {
  return {
    id: `static-future-${index}`,
    title: f.title,
    tagline: null,
    description: f.description,
    status: 'planned',
    stack: [],
    links: [],
    displayOrder: index,
    createdAt: STATIC_EPOCH,
    images: [],
  }
}

/** FR-018 최종 폴백: 기존 내장 데이터(content.ts)를 도메인 타입으로 변환 */
export function staticRoomContent(): RoomContent {
  return {
    laptopProjects: currentProjects.map(mapCurrent),
    plannedProjects: futureProjects.map(mapFuture),
    techStack: techStack.map(
      (t, i): TechStackRecord => ({
        id: `static-tech-${i}`,
        name: t.name,
        category: t.category,
        color: t.color,
        displayOrder: i,
      }),
    ),
    source: 'static',
  }
}
