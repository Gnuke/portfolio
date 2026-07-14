import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminRepository } from './adminRepository'

/**
 * supabase-js 클라이언트 스텁 — 실제 응답 구조(data/error)를 완전한 형태로
 * 재현한다 (헌법 원칙 II: 불완전 모의 금지).
 */
function createAuthStub(overrides: Record<string, unknown> = {}) {
  const auth = {
    signInWithPassword: vi.fn(async () => ({
      data: {
        user: { id: 'user-1', email: 'admin@example.com' },
        session: { access_token: 'token', user: { id: 'user-1', email: 'admin@example.com' } },
      },
      error: null,
    })),
    signOut: vi.fn(async () => ({ error: null })),
    getSession: vi.fn(async () => ({
      data: {
        session: { access_token: 'token', user: { id: 'user-1', email: 'admin@example.com' } },
      },
      error: null,
    })),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { id: 'sub-1', callback: () => {}, unsubscribe: vi.fn() } },
    })),
    ...overrides,
  }
  return { auth } as unknown as SupabaseClient
}

describe('adminRepository — 인증', () => {
  test('signIn은 이메일/비밀번호를 supabase auth에 전달한다', async () => {
    const client = createAuthStub()
    const repo = createAdminRepository(client)

    await repo.signIn('admin@example.com', 'pw-1234')

    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'pw-1234',
    })
  })

  test('signIn 실패(error 응답) 시 예외를 던진다', async () => {
    const client = createAuthStub({
      signInWithPassword: vi.fn(async () => ({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', status: 400 },
      })),
    })
    const repo = createAdminRepository(client)

    await expect(repo.signIn('admin@example.com', 'wrong')).rejects.toThrow()
  })

  test('getSession은 세션 사용자 이메일을 매핑한다', async () => {
    const repo = createAdminRepository(createAuthStub())
    expect(await repo.getSession()).toEqual({ email: 'admin@example.com' })
  })

  test('getSession은 세션이 없으면 null을 반환한다', async () => {
    const client = createAuthStub({
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
    })
    const repo = createAdminRepository(client)
    expect(await repo.getSession()).toBeNull()
  })

  test('signOut은 supabase auth에 위임한다', async () => {
    const client = createAuthStub()
    const repo = createAdminRepository(client)
    await repo.signOut()
    expect(client.auth.signOut).toHaveBeenCalled()
  })
})

/* ────────────────────────── CRUD (US2) ────────────────────────── */

type QueryResult = { data: unknown; error: { message: string } | null }

/** thenable 쿼리 빌더 스텁 — supabase-js 체이닝을 최소 표면으로 재현 */
function stubQuery(result: QueryResult) {
  const q: Record<string, ReturnType<typeof vi.fn>> & {
    then?: (resolve: (v: QueryResult) => void, reject: (e: unknown) => void) => void
  } = {} as never
  for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'order', 'single']) {
    q[m] = vi.fn(() => q)
  }
  q.then = (resolve, reject) => {
    Promise.resolve(result).then(resolve, reject)
  }
  return q
}

function createDbStub(results: Record<string, QueryResult[]>) {
  const queries: Record<string, ReturnType<typeof stubQuery>[]> = {}
  const storageBucket = {
    getPublicUrl: vi.fn((path: string) => ({
      data: { publicUrl: `https://cdn.test/${path}` },
    })),
    upload: vi.fn(async () => ({ data: { path: 'uploaded' }, error: null })),
    remove: vi.fn(async () => ({ data: [], error: null })),
  }
  const client = {
    from: vi.fn((table: string) => {
      const queue = results[table] ?? []
      const result =
        queue.length > 1
          ? (queue.shift() as QueryResult)
          : (queue[0] ?? { data: null, error: { message: `no stub for ${table}` } })
      const q = stubQuery(result)
      ;(queries[table] ??= []).push(q)
      return q
    }),
    storage: { from: vi.fn(() => storageBucket) },
    auth: {},
  }
  return { client: client as unknown as SupabaseClient, queries, storageBucket }
}

const projectRow = {
  id: 'p1',
  title: '프로젝트 A',
  description: '## 설명',
  status: 'current',
  tagline: '한 줄 소개',
  stack: ['React'],
  links: [{ label: 'GitHub', href: 'https://github.com/x' }],
  display_order: 1,
  created_at: '2026-07-01T00:00:00.000Z',
  updated_at: '2026-07-01T00:00:00.000Z',
}

const imageRows = [
  {
    id: 'i1',
    project_id: 'p1',
    storage_path: 'projects/p1/a.png',
    display_order: 0,
    is_cover: false,
    created_at: '2026-07-01T00:00:00.000Z',
  },
  {
    id: 'i2',
    project_id: 'p1',
    storage_path: 'projects/p1/b.png',
    display_order: 1,
    is_cover: true,
    created_at: '2026-07-02T00:00:00.000Z',
  },
]

const techRow = {
  id: 't1',
  name: 'Java',
  category: 'Language',
  color: '#e76f51',
  display_order: null,
  created_at: '2026-07-01T00:00:00.000Z',
}

describe('adminRepository — 프로젝트 CRUD', () => {
  test('listProjects는 행을 도메인 타입으로 매핑하고 이미지를 대표 우선으로 조인한다', async () => {
    const { client } = createDbStub({
      projects: [{ data: [projectRow], error: null }],
      project_images: [{ data: imageRows, error: null }],
    })
    const repo = createAdminRepository(client)

    const projects = await repo.listProjects()

    expect(projects).toHaveLength(1)
    expect(projects[0]).toMatchObject({
      id: 'p1',
      title: '프로젝트 A',
      status: 'current',
      displayOrder: 1,
      createdAt: '2026-07-01T00:00:00.000Z',
    })
    // 대표(is_cover) 이미지가 먼저, 공개 URL 파생
    expect(projects[0].images.map((i) => i.id)).toEqual(['i2', 'i1'])
    expect(projects[0].images[0]).toMatchObject({
      url: 'https://cdn.test/projects/p1/b.png',
      isCover: true,
    })
  })

  test('listProjects는 DB 오류 시 예외를 던진다', async () => {
    const { client } = createDbStub({
      projects: [{ data: null, error: { message: 'boom' } }],
      project_images: [{ data: [], error: null }],
    })
    const repo = createAdminRepository(client)
    await expect(repo.listProjects()).rejects.toThrow()
  })

  test('createProject는 snake_case 행으로 insert하고 결과를 매핑한다', async () => {
    const { client, queries } = createDbStub({
      projects: [{ data: projectRow, error: null }],
    })
    const repo = createAdminRepository(client)

    const created = await repo.createProject({
      title: '프로젝트 A',
      description: '## 설명',
      status: 'current',
      tagline: '한 줄 소개',
    })

    expect(queries.projects[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '프로젝트 A',
        description: '## 설명',
        status: 'current',
        tagline: '한 줄 소개',
        display_order: null,
      }),
    )
    expect(created.id).toBe('p1')
  })

  test('updateProject는 해당 id 행을 갱신한다', async () => {
    const { client, queries } = createDbStub({
      projects: [{ data: { ...projectRow, status: 'completed' }, error: null }],
    })
    const repo = createAdminRepository(client)

    const updated = await repo.updateProject('p1', {
      title: '프로젝트 A',
      description: '## 설명',
      status: 'completed',
    })

    expect(queries.projects[0].update).toHaveBeenCalled()
    expect(queries.projects[0].eq).toHaveBeenCalledWith('id', 'p1')
    expect(updated.status).toBe('completed')
  })

  test('deleteProject는 프로젝트 행을 삭제한다', async () => {
    const { client, queries } = createDbStub({
      projects: [{ data: null, error: null }],
      project_images: [{ data: [], error: null }],
    })
    const repo = createAdminRepository(client)

    await repo.deleteProject('p1')

    const lastQuery = queries.projects[queries.projects.length - 1]
    expect(lastQuery.delete).toHaveBeenCalled()
    expect(lastQuery.eq).toHaveBeenCalledWith('id', 'p1')
  })
})

describe('adminRepository — 이미지 (US3)', () => {
  test('uploadImage는 경로 규칙대로 storage에 올리고 행을 insert한다', async () => {
    const { client, queries, storageBucket } = createDbStub({
      project_images: [{ data: imageRows[0], error: null }],
    })
    const repo = createAdminRepository(client)
    const file = new File(['bytes'], 'shot.png', { type: 'image/png' })

    const record = await repo.uploadImage('p1', file)

    expect(storageBucket.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^projects\/p1\/[0-9a-f-]+\.png$/),
      file,
      expect.objectContaining({ contentType: 'image/png' }),
    )
    expect(queries.project_images[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: 'p1',
        is_cover: false,
      }),
    )
    expect(record.url).toContain('https://cdn.test/')
  })

  test('setCoverImage는 기존 대표를 해제한 뒤 새 대표를 지정한다', async () => {
    const { client, queries } = createDbStub({
      project_images: [
        { data: null, error: null }, // 기존 대표 해제
        { data: null, error: null }, // 새 대표 지정
      ],
    })
    const repo = createAdminRepository(client)

    await repo.setCoverImage('p1', 'i2')

    const [unsetQuery, setQuery] = queries.project_images
    expect(unsetQuery.update).toHaveBeenCalledWith({ is_cover: false })
    expect(unsetQuery.eq).toHaveBeenCalledWith('project_id', 'p1')
    expect(setQuery.update).toHaveBeenCalledWith({ is_cover: true })
    expect(setQuery.eq).toHaveBeenCalledWith('id', 'i2')
  })

  test('deleteImage는 storage 객체를 제거한 뒤 행을 삭제한다', async () => {
    const { client, queries, storageBucket } = createDbStub({
      project_images: [
        { data: imageRows[0], error: null }, // 경로 조회
        { data: null, error: null }, // 행 삭제
      ],
    })
    const repo = createAdminRepository(client)

    await repo.deleteImage('i1')

    expect(storageBucket.remove).toHaveBeenCalledWith(['projects/p1/a.png'])
    const deleteQuery = queries.project_images[1]
    expect(deleteQuery.delete).toHaveBeenCalled()
    expect(deleteQuery.eq).toHaveBeenCalledWith('id', 'i1')
  })

  test('deleteProject는 연결된 이미지의 storage 객체를 함께 정리한다', async () => {
    const { client, queries, storageBucket } = createDbStub({
      project_images: [{ data: imageRows, error: null }],
      projects: [{ data: null, error: null }],
    })
    const repo = createAdminRepository(client)

    await repo.deleteProject('p1')

    expect(storageBucket.remove).toHaveBeenCalledWith([
      'projects/p1/a.png',
      'projects/p1/b.png',
    ])
    const lastQuery = queries.projects[queries.projects.length - 1]
    expect(lastQuery.delete).toHaveBeenCalled()
    expect(lastQuery.eq).toHaveBeenCalledWith('id', 'p1')
  })
})

describe('adminRepository — 기술 스택 CRUD', () => {
  test('listTech는 행을 도메인 타입으로 매핑한다', async () => {
    const { client } = createDbStub({
      tech_stack: [{ data: [techRow], error: null }],
    })
    const repo = createAdminRepository(client)

    expect(await repo.listTech()).toEqual([
      { id: 't1', name: 'Java', category: 'Language', color: '#e76f51', displayOrder: null },
    ])
  })

  test('createTech는 기본 색상을 채워 insert한다', async () => {
    const { client, queries } = createDbStub({
      tech_stack: [{ data: techRow, error: null }],
    })
    const repo = createAdminRepository(client)

    await repo.createTech({ name: 'Java', category: 'Language' })

    expect(queries.tech_stack[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Java', category: 'Language' }),
    )
  })

  test('deleteTech는 해당 id 행을 삭제한다', async () => {
    const { client, queries } = createDbStub({
      tech_stack: [{ data: null, error: null }],
    })
    const repo = createAdminRepository(client)

    await repo.deleteTech('t1')

    expect(queries.tech_stack[0].delete).toHaveBeenCalled()
    expect(queries.tech_stack[0].eq).toHaveBeenCalledWith('id', 't1')
  })
})
