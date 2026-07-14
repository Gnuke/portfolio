/**
 * 관리자 레포지토리 계약 — specs/002-admin-project-cms/contracts/repositories.md
 * supabase-js 접점은 이 인터페이스의 구현(adminRepository.ts)으로만 한정한다.
 */
import type {
  ProjectImageRecord,
  ProjectRecord,
  ProjectStatus,
  TechCategory,
  TechCategoryRecord,
  TechStackRecord,
} from '../data/types'

export interface ProjectInput {
  title: string
  description: string
  status: ProjectStatus
  tagline?: string | null
  stack?: string[]
  links?: { label: string; href: string; disabled?: boolean }[]
  displayOrder?: number | null
}

export interface TechInput {
  name: string
  category?: TechCategory | null
  color?: string
  displayOrder?: number | null
}

export interface TechCategoryInput {
  name: string
  displayOrder?: number
}

export interface AdminSession {
  email: string
}

export interface AdminRepository {
  // 인증 (FR-002~005)
  signIn(email: string, password: string): Promise<void>
  signOut(): Promise<void>
  getSession(): Promise<AdminSession | null>
  onSessionChange(cb: (session: AdminSession | null) => void): () => void

  // 프로젝트 CRUD (FR-006~011)
  listProjects(): Promise<ProjectRecord[]>
  createProject(input: ProjectInput): Promise<ProjectRecord>
  updateProject(id: string, input: ProjectInput): Promise<ProjectRecord>
  deleteProject(id: string): Promise<void>

  // 이미지 (FR-012~015)
  uploadImage(projectId: string, file: File): Promise<ProjectImageRecord>
  deleteImage(imageId: string): Promise<void>
  setCoverImage(projectId: string, imageId: string): Promise<void>

  // 기술 스택 (FR-020)
  listTech(): Promise<TechStackRecord[]>
  createTech(input: TechInput): Promise<TechStackRecord>
  updateTech(id: string, input: TechInput): Promise<TechStackRecord>
  deleteTech(id: string): Promise<void>

  // 선반(기술 분류) 관리 — 이름 변경은 소속 기술에 전파, 삭제 시 미분류로
  listCategories(): Promise<TechCategoryRecord[]>
  createCategory(input: TechCategoryInput): Promise<TechCategoryRecord>
  updateCategory(id: string, input: TechCategoryInput): Promise<TechCategoryRecord>
  deleteCategory(id: string): Promise<void>
}
