import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { AdminRepository } from './adminRepository.types'
import type { TechCategoryRecord, TechStackRecord } from '../data/types'
import { techColorFor } from '../data/techColors'

export default function TechStackManager({ repo }: { repo: AdminRepository }) {
  const [items, setItems] = useState<TechStackRecord[]>([])
  const [categories, setCategories] = useState<TechCategoryRecord[]>([])
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<TechStackRecord | null>(null)
  const [editName, setEditName] = useState('')

  const reload = useCallback(async () => {
    const [tech, shelves] = await Promise.all([repo.listTech(), repo.listCategories()])
    setItems(tech)
    setCategories(shelves)
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
        category: category || null,
        color: techColorFor(name.trim()),
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
        color: techColorFor(editName.trim()),
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

      <ShelfManager repo={repo} categories={categories} onChanged={reload} />

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
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
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
                <span
                  className="admin-swatch"
                  style={{ background: item.color }}
                  aria-hidden="true"
                />
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

/** 선반(분류) 관리 — 목록 순서가 방문자 책장의 선반 순서가 된다. */
function ShelfManager({
  repo,
  categories,
  onChanged,
}: {
  repo: AdminRepository
  categories: TechCategoryRecord[]
  onChanged: () => Promise<void>
}) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const onAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('선반 이름을 입력해 주세요.')
      return
    }
    setError(null)
    try {
      const maxOrder = Math.max(0, ...categories.map((c) => c.displayOrder))
      await repo.createCategory({ name: name.trim(), displayOrder: maxOrder + 1 })
      setName('')
      await onChanged()
    } catch {
      setError('선반 추가에 실패했습니다. 이미 있는 이름인지 확인해 주세요.')
    }
  }

  /** index의 선반을 dir 방향으로 한 칸 이동 후, 전체 순서를 1..n으로 다시 저장 */
  const move = async (index: number, dir: -1 | 1) => {
    const next = [...categories]
    const neighbor = next[index + dir]
    if (!neighbor) return
    next[index + dir] = next[index]
    next[index] = neighbor
    setError(null)
    try {
      await Promise.all(
        next.map((c, i) =>
          c.displayOrder === i + 1
            ? Promise.resolve()
            : repo.updateCategory(c.id, { name: c.name, displayOrder: i + 1 }),
        ),
      )
      await onChanged()
    } catch {
      setError('순서 변경에 실패했습니다. 다시 시도해 주세요.')
    }
  }

  const onRename = async () => {
    const target = categories.find((c) => c.id === editingId)
    if (!target || !editName.trim()) return
    setError(null)
    try {
      await repo.updateCategory(target.id, {
        name: editName.trim(),
        displayOrder: target.displayOrder,
      })
      setEditingId(null)
      await onChanged()
    } catch {
      setError('이름 변경에 실패했습니다. 이미 있는 이름인지 확인해 주세요.')
    }
  }

  const onDelete = async (cat: TechCategoryRecord) => {
    if (!window.confirm(`"${cat.name}" 선반을 삭제할까요? 소속 기술은 미분류로 이동합니다.`)) {
      return
    }
    setError(null)
    try {
      await repo.deleteCategory(cat.id)
      await onChanged()
    } catch {
      setError('선반 삭제에 실패했습니다. 다시 시도해 주세요.')
    }
  }

  return (
    <div className="admin-shelves">
      <h3>선반 관리</h3>
      <p className="admin-hint">위에서부터 방문자 책장에 표시되는 순서입니다.</p>

      <ul className="admin-list">
        {categories.map((cat, i) => (
          <li key={cat.id}>
            {editingId === cat.id ? (
              <>
                <label className="admin-field grow">
                  선반 이름 수정
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                </label>
                <button type="button" onClick={() => void onRename()}>
                  저장
                </button>
                <button type="button" onClick={() => setEditingId(null)}>
                  취소
                </button>
              </>
            ) : (
              <>
                <span className="admin-move">
                  <button
                    type="button"
                    aria-label={`${cat.name} 위로`}
                    disabled={i === 0}
                    onClick={() => void move(i, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`${cat.name} 아래로`}
                    disabled={i === categories.length - 1}
                    onClick={() => void move(i, 1)}
                  >
                    ↓
                  </button>
                </span>
                <div className="grow">
                  <b>{cat.name}</b>
                </div>
                <button
                  type="button"
                  aria-label={`${cat.name} 선반 이름 변경`}
                  onClick={() => {
                    setEditingId(cat.id)
                    setEditName(cat.name)
                  }}
                >
                  이름 변경
                </button>
                <button
                  type="button"
                  aria-label={`${cat.name} 선반 삭제`}
                  onClick={() => void onDelete(cat)}
                >
                  삭제
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      <form className="admin-form" onSubmit={onAdd}>
        <div className="admin-form-row">
          <label className="admin-field">
            새 선반 이름
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <div className="admin-form-actions">
            <button type="submit">선반 추가</button>
          </div>
        </div>
        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  )
}
