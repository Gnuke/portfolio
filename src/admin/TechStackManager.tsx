import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { AdminRepository } from './adminRepository.types'
import type { TechCategory, TechStackRecord } from '../data/types'

const CATEGORIES: TechCategory[] = ['Language', 'Backend', 'Frontend', 'Infra', 'Tool']

export default function TechStackManager({ repo }: { repo: AdminRepository }) {
  const [items, setItems] = useState<TechStackRecord[]>([])
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<TechStackRecord | null>(null)
  const [editName, setEditName] = useState('')

  const reload = useCallback(async () => {
    setItems(await repo.listTech())
  }, [repo])

  useEffect(() => {
    void reload()
  }, [reload])

  const onAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('기술 이름을 입력해 주세요.')
      return
    }
    setError(null)
    try {
      await repo.createTech({
        name: name.trim(),
        category: (category || null) as TechCategory | null,
      })
      setName('')
      await reload()
    } catch {
      setError('추가에 실패했습니다. 다시 시도해 주세요.')
    }
  }

  const onSaveEdit = async () => {
    if (!editing || !editName.trim()) return
    try {
      await repo.updateTech(editing.id, {
        name: editName.trim(),
        category: editing.category,
        color: editing.color,
        displayOrder: editing.displayOrder,
      })
      setEditing(null)
      await reload()
    } catch {
      setError('수정에 실패했습니다. 다시 시도해 주세요.')
    }
  }

  const onDelete = async (item: TechStackRecord) => {
    if (!window.confirm(`"${item.name}" 기술을 삭제할까요?`)) return
    await repo.deleteTech(item.id)
    await reload()
  }

  return (
    <section className="admin-section">
      <h2>기술 스택 (책장)</h2>

      <form className="admin-form" onSubmit={onAdd}>
        <div className="admin-form-row">
          <label className="admin-field">
            기술 이름
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="admin-field">
            분류 (선택)
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">미분류</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}
        <div className="admin-form-actions">
          <button type="submit">추가</button>
        </div>
      </form>

      <ul className="admin-list">
        {items.map((item) => (
          <li key={item.id}>
            {editing?.id === item.id ? (
              <>
                <label className="admin-field grow">
                  기술 이름 수정
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </label>
                <button type="button" onClick={() => void onSaveEdit()}>
                  저장
                </button>
                <button type="button" onClick={() => setEditing(null)}>
                  취소
                </button>
              </>
            ) : (
              <>
                <div className="grow">
                  <b>{item.name}</b>
                </div>
                <span className="admin-badge">{item.category ?? '미분류'}</span>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(item)
                    setEditName(item.name)
                  }}
                >
                  수정
                </button>
                <button type="button" onClick={() => void onDelete(item)}>
                  삭제
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
