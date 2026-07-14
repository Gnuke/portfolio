import type { SupabaseClient } from '@supabase/supabase-js'
import type { AdminRepository, ProjectInput, TechInput } from './adminRepository.types'
import type {
  ProjectImageRecord,
  ProjectLinkRecord,
  ProjectRecord,
  ProjectStatus,
  TechCategory,
  TechStackRecord,
} from '../data/types'

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
  updated_at: string
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
  created_at: string
}

function throwIf(error: { message: string } | null): void {
  if (error) throw new Error(error.message)
}

/** 대표 우선 → display_order → created_at (FR-021) */
export function sortImageRows(rows: ImageRow[]): ImageRow[] {
  return [...rows].sort(
    (a, b) =>
      Number(b.is_cover) - Number(a.is_cover) ||
      a.display_order - b.display_order ||
      a.created_at.localeCompare(b.created_at),
  )
}

function toProjectRow(input: ProjectInput) {
  return {
    title: input.title,
    description: input.description,
    status: input.status,
    tagline: input.tagline ?? null,
    stack: input.stack ?? [],
    links: input.links ?? [],
    display_order: input.displayOrder ?? null,
  }
}

function toTechRow(input: TechInput) {
  return {
    name: input.name,
    category: input.category ?? null,
    ...(input.color !== undefined ? { color: input.color } : {}),
    display_order: input.displayOrder ?? null,
  }
}

function mapTechRow(row: TechRow): TechStackRecord {
  return {
    id: row.id,
    name: row.name,
    category: (row.category as TechCategory | null) ?? null,
    color: row.color,
    displayOrder: row.display_order,
  }
}

export function createAdminRepository(client: SupabaseClient): AdminRepository {
  const publicUrl = (path: string): string =>
    client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl

  const mapImageRow = (row: ImageRow): ProjectImageRecord => ({
    id: row.id,
    url: publicUrl(row.storage_path),
    isCover: row.is_cover,
  })

  const mapProjectRow = (row: ProjectRow, imageRows: ImageRow[]): ProjectRecord => ({
    id: row.id,
    title: row.title,
    tagline: row.tagline,
    description: row.description,
    status: row.status as ProjectStatus,
    stack: row.stack ?? [],
    links: Array.isArray(row.links) ? (row.links as ProjectLinkRecord[]) : [],
    displayOrder: row.display_order,
    createdAt: row.created_at,
    images: sortImageRows(imageRows).map(mapImageRow),
  })

  return {
    /* ── 인증 (FR-002~005) ── */

    async signIn(email, password) {
      const { error } = await client.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
    },

    async signOut() {
      const { error } = await client.auth.signOut()
      if (error) throw new Error(error.message)
    },

    async getSession() {
      const { data } = await client.auth.getSession()
      const email = data.session?.user?.email
      return email ? { email } : null
    },

    onSessionChange(cb) {
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        const email = session?.user?.email
        cb(email ? { email } : null)
      })
      return () => data.subscription.unsubscribe()
    },

    /* ── 프로젝트 CRUD (FR-006~011) ── */

    async listProjects() {
      const [projectsRes, imagesRes] = await Promise.all([
        client.from('projects').select('*').order('created_at', { ascending: false }),
        client.from('project_images').select('*'),
      ])
      throwIf(projectsRes.error)
      throwIf(imagesRes.error)
      const imageRows = (imagesRes.data ?? []) as ImageRow[]
      return ((projectsRes.data ?? []) as ProjectRow[]).map((row) =>
        mapProjectRow(
          row,
          imageRows.filter((img) => img.project_id === row.id),
        ),
      )
    },

    async createProject(input) {
      const res = await client.from('projects').insert(toProjectRow(input)).select().single()
      throwIf(res.error)
      return mapProjectRow(res.data as ProjectRow, [])
    },

    async updateProject(id, input) {
      const res = await client
        .from('projects')
        .update(toProjectRow(input))
        .eq('id', id)
        .select()
        .single()
      throwIf(res.error)
      return mapProjectRow(res.data as ProjectRow, [])
    },

    async deleteProject(id) {
      // 연결 이미지 Storage 정리 — 베스트 에포트 (spec Edge Case: 잔여물 방치 금지)
      const imgRes = await client
        .from('project_images')
        .select('storage_path')
        .eq('project_id', id)
      const paths = ((imgRes.data ?? []) as { storage_path: string }[]).map(
        (r) => r.storage_path,
      )
      if (paths.length > 0) {
        await client.storage.from(BUCKET).remove(paths).catch(() => undefined)
      }
      const res = await client.from('projects').delete().eq('id', id)
      throwIf(res.error)
    },

    /* ── 이미지 (FR-012~015) ── */

    async uploadImage(projectId, file) {
      const dotIndex = file.name.lastIndexOf('.')
      const ext = dotIndex > -1 ? file.name.slice(dotIndex + 1).toLowerCase() : 'png'
      const path = `projects/${projectId}/${crypto.randomUUID()}.${ext}`

      const uploadRes = await client.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type })
      if (uploadRes.error) throw new Error(uploadRes.error.message)

      const res = await client
        .from('project_images')
        .insert({ project_id: projectId, storage_path: path, is_cover: false })
        .select()
        .single()
      throwIf(res.error)
      return mapImageRow(res.data as ImageRow)
    },

    async deleteImage(imageId) {
      const rowRes = await client
        .from('project_images')
        .select('storage_path')
        .eq('id', imageId)
        .single()
      throwIf(rowRes.error)
      const path = (rowRes.data as { storage_path: string }).storage_path
      await client.storage.from(BUCKET).remove([path]).catch(() => undefined)

      const del = await client.from('project_images').delete().eq('id', imageId)
      throwIf(del.error)
    },

    async setCoverImage(projectId, imageId) {
      const unset = await client
        .from('project_images')
        .update({ is_cover: false })
        .eq('project_id', projectId)
      throwIf(unset.error)
      const set = await client
        .from('project_images')
        .update({ is_cover: true })
        .eq('id', imageId)
      throwIf(set.error)
    },

    /* ── 기술 스택 (FR-020) ── */

    async listTech() {
      const res = await client
        .from('tech_stack')
        .select('*')
        .order('display_order', { ascending: true, nullsFirst: false })
      throwIf(res.error)
      return ((res.data ?? []) as TechRow[]).map(mapTechRow)
    },

    async createTech(input) {
      const res = await client.from('tech_stack').insert(toTechRow(input)).select().single()
      throwIf(res.error)
      return mapTechRow(res.data as TechRow)
    },

    async updateTech(id, input) {
      const res = await client
        .from('tech_stack')
        .update(toTechRow(input))
        .eq('id', id)
        .select()
        .single()
      throwIf(res.error)
      return mapTechRow(res.data as TechRow)
    },

    async deleteTech(id) {
      const res = await client.from('tech_stack').delete().eq('id', id)
      throwIf(res.error)
    },
  }
}
