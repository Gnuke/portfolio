import { useCallback, useEffect, useState } from 'react'
import type { AdminRepository, AdminSession } from './adminRepository.types'
import type { ProjectRecord } from '../data/types'
import LoginForm from './LoginForm'
import ProjectList from './ProjectList'
import ProjectForm from './ProjectForm'
import TechStackManager from './TechStackManager'

/** 'new' = 신규 작성 모드 */
type Editing = ProjectRecord | 'new' | null

function Dashboard({ repo }: { repo: AdminRepository }) {
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [editing, setEditing] = useState<Editing>(null)

  const reload = useCallback(async () => {
    setProjects(await repo.listProjects())
  }, [repo])

  useEffect(() => {
    void reload()
  }, [reload])

  const onDelete = async (project: ProjectRecord) => {
    await repo.deleteProject(project.id)
    await reload()
  }

  return (
    <main className="admin-main">
      <section className="admin-section">
        <div className="admin-section-head">
          <h2>프로젝트 (노트북 · 화이트보드)</h2>
          <button type="button" onClick={() => setEditing('new')}>
            새 프로젝트
          </button>
        </div>

        {editing !== null && (
          <ProjectForm
            repo={repo}
            project={editing === 'new' ? null : editing}
            onSaved={() => {
              setEditing(null)
              void reload()
            }}
            onCancel={() => setEditing(null)}
          />
        )}

        <ProjectList
          projects={projects}
          onEdit={(p) => setEditing(p)}
          onDelete={(p) => void onDelete(p)}
        />
      </section>

      <TechStackManager repo={repo} />
    </main>
  )
}

export default function AdminApp({ repo }: { repo: AdminRepository }) {
  // undefined = 세션 확인 중, null = 미로그인
  const [session, setSession] = useState<AdminSession | null | undefined>(undefined)

  useEffect(() => {
    let alive = true
    void repo.getSession().then((s) => {
      if (alive) setSession(s)
    })
    const unsubscribe = repo.onSessionChange((s) => setSession(s))
    return () => {
      alive = false
      unsubscribe()
    }
  }, [repo])

  if (session === undefined) return null

  if (!session) {
    return (
      <div className="admin-shell">
        <LoginForm repo={repo} />
      </div>
    )
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <h1>Only-One Room · 콘텐츠 관리</h1>
        <div className="admin-header-right">
          <span className="admin-user">{session.email}</span>
          <button type="button" onClick={() => void repo.signOut()}>
            로그아웃
          </button>
        </div>
      </header>
      <Dashboard repo={repo} />
    </div>
  )
}
