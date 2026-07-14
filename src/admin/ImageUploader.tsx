import { useState, type ChangeEvent } from 'react'
import type { AdminRepository } from './adminRepository.types'
import type { ProjectImageRecord, ProjectRecord } from '../data/types'
import { validateImageFile } from './imageValidation'

const REASON_MESSAGES = {
  type: '이미지 파일만 업로드할 수 있습니다 (PNG, JPEG, WebP, GIF).',
  size: '파일당 최대 5MB까지 업로드할 수 있습니다.',
  count: '프로젝트당 이미지는 최대 10장입니다.',
} as const

export default function ImageUploader({
  repo,
  project,
}: {
  repo: AdminRepository
  project: ProjectRecord
}) {
  const [images, setImages] = useState<ProjectImageRecord[]>(project.images)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const verdict = validateImageFile(file, images.length)
    if (!verdict.ok) {
      setError(REASON_MESSAGES[verdict.reason])
      return
    }

    setError(null)
    setBusy(true)
    try {
      const record = await repo.uploadImage(project.id, file)
      setImages((prev) => [...prev, record])
    } catch {
      setError('업로드에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  const onDelete = async (imageId: string) => {
    await repo.deleteImage(imageId)
    setImages((prev) => prev.filter((img) => img.id !== imageId))
  }

  const onSetCover = async (imageId: string) => {
    await repo.setCoverImage(project.id, imageId)
    setImages((prev) => prev.map((img) => ({ ...img, isCover: img.id === imageId })))
  }

  return (
    <div className="admin-uploader">
      <label className="admin-field">
        이미지 추가
        <input type="file" onChange={(e) => void onSelect(e)} disabled={busy} />
      </label>
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      <div className="admin-images">
        {images.map((img) => (
          <div className="admin-image-card" key={img.id}>
            <img src={img.url} alt="프로젝트 스크린샷" />
            {img.isCover && <span className="is-cover">대표</span>}
            <div className="admin-image-actions">
              {!img.isCover && (
                <button type="button" onClick={() => void onSetCover(img.id)}>
                  대표 지정
                </button>
              )}
              <button type="button" onClick={() => void onDelete(img.id)}>
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
