import type { ProjectRecord, ProjectStatus } from '../data/types'

const STATUS_LABELS: Record<ProjectStatus, string> = {
  current: '진행 중',
  completed: '완성',
  planned: '예정',
}

export default function ProjectList({
  projects,
  onEdit,
  onDelete,
}: {
  projects: ProjectRecord[]
  onEdit: (project: ProjectRecord) => void
  onDelete: (project: ProjectRecord) => void
}) {
  if (projects.length === 0) {
    return <p className="admin-notice">등록된 프로젝트가 없습니다.</p>
  }

  return (
    <ul className="admin-list">
      {projects.map((p) => (
        <li key={p.id}>
          <div className="grow">
            <b>{p.title}</b>
          </div>
          <span className={`admin-badge status-${p.status}`}>
            {STATUS_LABELS[p.status]}
          </span>
          <button type="button" onClick={() => onEdit(p)}>
            수정
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`"${p.title}" 프로젝트를 삭제할까요? 되돌릴 수 없습니다.`)) {
                onDelete(p)
              }
            }}
          >
            삭제
          </button>
        </li>
      ))}
    </ul>
  )
}
