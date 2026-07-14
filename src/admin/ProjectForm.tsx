import { useState, type FormEvent } from 'react'
import type { AdminRepository, ProjectInput } from './adminRepository.types'
import type { ProjectLinkRecord, ProjectRecord, ProjectStatus } from '../data/types'
import ImageUploader from './ImageUploader'

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'current', label: '진행 중' },
  { value: 'completed', label: '완성' },
  { value: 'planned', label: '예정' },
]

function parseLinks(text: string): ProjectLinkRecord[] {
  return text
    .split('\n')
    .map((line) => {
      const [label, href] = line.split('|').map((s) => s.trim())
      return label && href ? { label, href } : null
    })
    .filter((l): l is ProjectLinkRecord => l !== null)
}

export default function ProjectForm({
  repo,
  project,
  onSaved,
  onCancel,
}: {
  repo: AdminRepository
  project: ProjectRecord | null
  onSaved: (project: ProjectRecord) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(project?.title ?? '')
  const [tagline, setTagline] = useState(project?.tagline ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'current')
  const [stackText, setStackText] = useState(project?.stack.join(', ') ?? '')
  const [linksText, setLinksText] = useState(
    project?.links.map((l) => `${l.label} | ${l.href}`).join('\n') ?? '',
  )
  const [orderText, setOrderText] = useState(
    project?.displayOrder != null ? String(project.displayOrder) : '',
  )
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; description?: string }>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errors: typeof fieldErrors = {}
    if (!title.trim()) errors.title = '제목을 입력해 주세요.'
    if (!description.trim()) errors.description = '설명을 입력해 주세요.'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const input: ProjectInput = {
      title: title.trim(),
      description,
      status,
      tagline: tagline.trim() ? tagline.trim() : null,
      stack: stackText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      links: parseLinks(linksText),
      displayOrder: orderText.trim() !== '' ? Number(orderText) : null,
    }

    setBusy(true)
    setSubmitError(null)
    try {
      const saved = project
        ? await repo.updateProject(project.id, input)
        : await repo.createProject(input)
      onSaved(saved)
    } catch {
      setSubmitError('저장에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <h3>{project ? '프로젝트 수정' : '새 프로젝트'}</h3>

      <label className="admin-field">
        제목
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      {fieldErrors.title && (
        <p className="admin-error" role="alert">
          {fieldErrors.title}
        </p>
      )}

      <label className="admin-field">
        한 줄 소개
        <input value={tagline} onChange={(e) => setTagline(e.target.value)} />
      </label>

      <label className="admin-field">
        설명 (마크다운)
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      {fieldErrors.description && (
        <p className="admin-error" role="alert">
          {fieldErrors.description}
        </p>
      )}

      <div className="admin-form-row">
        <label className="admin-field">
          상태
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          표시 순서 (선택)
          <input
            type="number"
            value={orderText}
            onChange={(e) => setOrderText(e.target.value)}
          />
        </label>
      </div>

      <label className="admin-field">
        사용 기술 (쉼표로 구분)
        <input value={stackText} onChange={(e) => setStackText(e.target.value)} />
      </label>

      <label className="admin-field">
        링크 (한 줄에 하나, 형식: 라벨 | URL)
        <textarea
          rows={3}
          value={linksText}
          onChange={(e) => setLinksText(e.target.value)}
        />
      </label>

      {project ? (
        <ImageUploader repo={repo} project={project} />
      ) : (
        <p className="admin-notice">이미지는 프로젝트 저장 후 수정 화면에서 추가할 수 있습니다.</p>
      )}

      {submitError && (
        <p className="admin-error" role="alert">
          {submitError}
        </p>
      )}

      <div className="admin-form-actions">
        <button type="button" onClick={onCancel}>
          취소
        </button>
        <button type="submit" className="primary" disabled={busy}>
          저장
        </button>
      </div>
    </form>
  )
}
