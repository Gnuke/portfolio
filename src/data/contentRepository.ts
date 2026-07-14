import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseClient } from '../lib/supabaseClient'
import { compareGalleryRows, sortPlannedProjects, sortProjectsForLaptop } from './sortContent'
import type {
  ProjectLinkRecord,
  ProjectRecord,
  ProjectStatus,
  RoomContent,
  TechCategory,
  TechStackRecord,
} from './types'

const BUCKET = 'project-images'

interface ProjectRow {
  id: string
  title: string
  description: string
  status: string
  tagline: string | null
  stack: string[] | null
  links: unknown
  display_order: number | null
  created_at: string
}

interface ImageRow {
  id: string
  project_id: string
  storage_path: string
  display_order: number
  is_cover: boolean
  created_at: string
}

interface TechRow {
  id: string
  name: string
  category: string | null
  color: string
  display_order: number | null
}

function compareTech(a: TechStackRecord, b: TechStackRecord): number {
  if (a.displayOrder != null && b.displayOrder != null) return a.displayOrder - b.displayOrder
  if (a.displayOrder != null) return -1
  if (b.displayOrder != null) return 1
  return 0
}

/** 방문자용 원격 콘텐츠 로드. 실패 시 reject — 폴백은 ContentContext 책임 (FR-018). */
export async function fetchRoomContent(
  client: SupabaseClient = getSupabaseClient(),
): Promise<RoomContent> {
  const [projectsRes, imagesRes, techRes] = await Promise.all([
    client.from('projects').select('*'),
    client.from('project_images').select('*'),
    client.from('tech_stack').select('*'),
  ])
  for (const res of [projectsRes, imagesRes, techRes]) {
    if (res.error) throw new Error(res.error.message)
  }

  const urlFor = (path: string): string =>
    client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl

  const imageRows = (imagesRes.data ?? []) as ImageRow[]

  const projects: ProjectRecord[] = ((projectsRes.data ?? []) as ProjectRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    tagline: row.tagline,
    description: row.description,
    status: row.status as ProjectStatus,
    stack: row.stack ?? [],
    links: Array.isArray(row.links) ? (row.links as ProjectLinkRecord[]) : [],
    displayOrder: row.display_order,
    createdAt: row.created_at,
    images: imageRows
      .filter((img) => img.project_id === row.id)
      .sort(compareGalleryRows)
      .map((img) => ({ id: img.id, url: urlFor(img.storage_path), isCover: img.is_cover })),
  }))

  const techStack = ((techRes.data ?? []) as TechRow[])
    .map(
      (row): TechStackRecord => ({
        id: row.id,
        name: row.name,
        category: (row.category as TechCategory | null) ?? null,
        color: row.color,
        displayOrder: row.display_order,
      }),
    )
    .sort(compareTech)

  return {
    laptopProjects: sortProjectsForLaptop(projects),
    plannedProjects: sortPlannedProjects(projects),
    techStack,
    source: 'remote',
  }
}
