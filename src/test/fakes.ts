/**
 * 테스트 전용 fake 구현 — AdminRepository 인터페이스 **전체**를 인메모리로
 * 구현한다 (헌법 원칙 II: 불완전 모의 금지).
 */
import type {
  AdminRepository,
  AdminSession,
  ProjectInput,
  TechInput,
} from '../admin/adminRepository.types'
import type {
  ProjectImageRecord,
  ProjectRecord,
  RoomContent,
  TechStackRecord,
} from '../data/types'

let seq = 0
const nextId = () => `fake-${++seq}`

export function buildProject(overrides: Partial<ProjectRecord> = {}): ProjectRecord {
  return {
    id: nextId(),
    title: '테스트 프로젝트',
    tagline: null,
    description: '프로젝트 설명입니다.',
    status: 'current',
    stack: [],
    links: [],
    displayOrder: null,
    createdAt: '2026-07-13T00:00:00.000Z',
    images: [],
    ...overrides,
  }
}

export function buildImage(overrides: Partial<ProjectImageRecord> = {}): ProjectImageRecord {
  const id = overrides.id ?? nextId()
  return {
    id,
    url: `https://fake.storage/project-images/${id}.png`,
    isCover: false,
    ...overrides,
  }
}

export function buildTech(overrides: Partial<TechStackRecord> = {}): TechStackRecord {
  return {
    id: nextId(),
    name: 'React',
    category: 'Frontend',
    color: '#4aa8c0',
    displayOrder: null,
    ...overrides,
  }
}

export function buildRoomContent(overrides: Partial<RoomContent> = {}): RoomContent {
  return {
    laptopProjects: [],
    plannedProjects: [],
    techStack: [],
    source: 'remote',
    ...overrides,
  }
}

export interface FakeAdminRepository extends AdminRepository {
  /** 현재 세션 (테스트 초기 상태 조작용) */
  session: AdminSession | null
  projects: ProjectRecord[]
  tech: TechStackRecord[]
}

export function createFakeAdminRepository(init?: {
  email?: string
  password?: string
  session?: AdminSession | null
  projects?: ProjectRecord[]
  tech?: TechStackRecord[]
}): FakeAdminRepository {
  const email = init?.email ?? 'admin@example.com'
  const password = init?.password ?? 'correct-password'
  const listeners = new Set<(session: AdminSession | null) => void>()

  const notify = () => listeners.forEach((cb) => cb(repo.session))

  const repo: FakeAdminRepository = {
    session: init?.session ?? null,
    projects: init?.projects ?? [],
    tech: init?.tech ?? [],

    async signIn(inputEmail, inputPassword) {
      if (inputEmail !== email || inputPassword !== password) {
        throw new Error('invalid credentials')
      }
      repo.session = { email }
      notify()
    },
    async signOut() {
      repo.session = null
      notify()
    },
    async getSession() {
      return repo.session
    },
    onSessionChange(cb) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },

    async listProjects() {
      return [...repo.projects]
    },
    async createProject(input: ProjectInput) {
      const project = buildProject({
        title: input.title,
        description: input.description,
        status: input.status,
        tagline: input.tagline ?? null,
        stack: input.stack ?? [],
        links: input.links ?? [],
        displayOrder: input.displayOrder ?? null,
      })
      repo.projects.push(project)
      return project
    },
    async updateProject(id, input) {
      const idx = repo.projects.findIndex((p) => p.id === id)
      if (idx < 0) throw new Error('not found')
      const updated: ProjectRecord = {
        ...repo.projects[idx],
        title: input.title,
        description: input.description,
        status: input.status,
        tagline: input.tagline ?? null,
        stack: input.stack ?? [],
        links: input.links ?? [],
        displayOrder: input.displayOrder ?? null,
      }
      repo.projects[idx] = updated
      return updated
    },
    async deleteProject(id) {
      repo.projects = repo.projects.filter((p) => p.id !== id)
    },

    async uploadImage(projectId, file) {
      const project = repo.projects.find((p) => p.id === projectId)
      if (!project) throw new Error('not found')
      const image = buildImage({ url: `https://fake.storage/projects/${projectId}/${file.name}` })
      project.images = [...project.images, image]
      return image
    },
    async deleteImage(imageId) {
      for (const p of repo.projects) {
        p.images = p.images.filter((img) => img.id !== imageId)
      }
    },
    async setCoverImage(projectId, imageId) {
      const project = repo.projects.find((p) => p.id === projectId)
      if (!project) throw new Error('not found')
      project.images = project.images.map((img) => ({
        ...img,
        isCover: img.id === imageId,
      }))
    },

    async listTech() {
      return [...repo.tech]
    },
    async createTech(input: TechInput) {
      const item = buildTech({
        name: input.name,
        category: input.category ?? null,
        color: input.color ?? '#7f9aa6',
        displayOrder: input.displayOrder ?? null,
      })
      repo.tech.push(item)
      return item
    },
    async updateTech(id, input) {
      const idx = repo.tech.findIndex((t) => t.id === id)
      if (idx < 0) throw new Error('not found')
      const updated: TechStackRecord = {
        ...repo.tech[idx],
        name: input.name,
        category: input.category ?? null,
        color: input.color ?? repo.tech[idx].color,
        displayOrder: input.displayOrder ?? null,
      }
      repo.tech[idx] = updated
      return updated
    },
    async deleteTech(id) {
      repo.tech = repo.tech.filter((t) => t.id !== id)
    },
  }

  return repo
}
