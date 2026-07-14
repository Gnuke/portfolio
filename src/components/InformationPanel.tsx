import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { RoomObjectConfig } from '../data/scene'
import { useRoomContent } from '../context/ContentContext'
import type {
  ProjectRecord,
  ProjectStatus,
  TechCategory,
  TechStackRecord,
} from '../data/types'

/**
 * InformationPanel — 선택된 오브젝트의 정보를 Glassmorphism 패널로 표시.
 * 콘텐츠 원천은 ContentContext (원격 → 캐시 → 정적 폴백, FR-016/018).
 * 컨셉: "패널이 곧 오브젝트" — 각 패널은 클릭한 사물의 재질을 물려받는다.
 *   노트북   → 에디터 창 (타이틀바 + 실행 상태 LED)
 *   책장     → 책등이 꽂힌 나무 선반
 *   화이트보드 → 보드 위 마커 손글씨 + 포스트잇
 */

const STATUS_LABELS: Record<ProjectStatus, string> = {
  current: '진행 중',
  completed: '완성',
  planned: '예정',
}

/* 배경색 밝기에 따라 책등 글자색 결정 (YIQ) */
function spineTextColor(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const yiq = (((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000
  return yiq > 150 ? 'rgba(40, 32, 18, 0.85)' : 'rgba(255, 252, 245, 0.92)'
}

/* 책 높이/폭은 고정 패턴으로 순환 — 실제 책장처럼 들쭉날쭉하게 */
const BOOK_HEIGHTS = [96, 108, 88, 114, 100, 92]
const BOOK_WIDTHS = [30, 27, 33, 28, 31, 29]

function EmptyNotice({ what }: { what: string }) {
  return (
    <p className="panel-empty">
      {what}는 아직 준비 중입니다 — 곧 채워질 예정이에요.
    </p>
  )
}

/* 패널 내 이미지 갤러리 — 대표 우선, 이전/다음 (FR-021) */
function Gallery({ project }: { project: ProjectRecord }) {
  const [idx, setIdx] = useState(0)
  const images = project.images
  if (images.length === 0) return null
  const safeIdx = Math.min(idx, images.length - 1)
  const image = images[safeIdx]

  return (
    <div className="p-gallery">
      <img src={image.url} alt={`${project.title} 스크린샷 ${safeIdx + 1}`} />
      {images.length > 1 && (
        <div className="p-gallery-nav">
          <button
            type="button"
            aria-label="이전 이미지"
            onClick={() => setIdx(Math.max(0, safeIdx - 1))}
            disabled={safeIdx === 0}
          >
            ◂
          </button>
          <span>
            {safeIdx + 1} / {images.length}
          </span>
          <button
            type="button"
            aria-label="다음 이미지"
            onClick={() => setIdx(Math.min(images.length - 1, safeIdx + 1))}
            disabled={safeIdx === images.length - 1}
          >
            ▸
          </button>
        </div>
      )}
    </div>
  )
}

/* 노트북 — 진행 중·완성 통합 목록 + 이전/다음 (FR-017) */
function ProjectPanel() {
  const { laptopProjects } = useRoomContent()
  const [idx, setIdx] = useState(0)

  if (laptopProjects.length === 0) return <EmptyNotice what="프로젝트" />

  const safeIdx = Math.min(idx, laptopProjects.length - 1)
  const project = laptopProjects[safeIdx]

  return (
    <>
      <h2 className="p-name">{project.title}</h2>
      <div className="p-meta">
        <span className={`p-badge status-${project.status}`}>
          {STATUS_LABELS[project.status]}
        </span>
      </div>
      {project.tagline && <p className="p-tagline">{project.tagline}</p>}

      <Gallery key={project.id} project={project} />

      <div className="p-desc p-desc-md">
        <ReactMarkdown>{project.description}</ReactMarkdown>
      </div>

      {project.stack.length > 0 && (
        <>
          <h3 className="p-subhead">기술</h3>
          <div className="chips">
            {project.stack.map((s) => (
              <span className="chip" key={s}>
                {s}
              </span>
            ))}
          </div>
        </>
      )}

      {project.links.length > 0 && (
        <div className="p-links">
          {project.links.map((l) =>
            l.disabled ? (
              <span className="p-link is-disabled" key={l.label}>
                {l.label} · 준비 중
              </span>
            ) : (
              <a
                className="p-link"
                href={l.href}
                key={l.label}
                target="_blank"
                rel="noreferrer"
              >
                {l.label} ↗
              </a>
            ),
          )}
        </div>
      )}

      {laptopProjects.length > 1 && (
        <div className="p-slidehint">
          <button
            type="button"
            aria-label="이전 프로젝트"
            onClick={() => setIdx(Math.max(0, safeIdx - 1))}
            disabled={safeIdx === 0}
          >
            ◂
          </button>
          <b>
            {safeIdx + 1} / {laptopProjects.length}
          </b>
          <button
            type="button"
            aria-label="다음 프로젝트"
            onClick={() => setIdx(Math.min(laptopProjects.length - 1, safeIdx + 1))}
            disabled={safeIdx === laptopProjects.length - 1}
          >
            ▸
          </button>
        </div>
      )}
    </>
  )
}

const SHELF_ORDER: TechCategory[] = ['Language', 'Backend', 'Frontend', 'Infra', 'Tool']

/* 책장 — 기술 스택, 미분류는 Tool 선반 (FR-016) */
function StackPanel() {
  const { techStack } = useRoomContent()

  if (techStack.length === 0) return <EmptyNotice what="기술 스택" />

  const shelfOf = (t: TechStackRecord): TechCategory => t.category ?? 'Tool'
  const shelves = SHELF_ORDER.map((category) => ({
    category,
    books: techStack.filter((t) => shelfOf(t) === category),
  })).filter((s) => s.books.length > 0)

  return (
    <div className="shelves">
      {shelves.map((shelf) => (
        <div key={shelf.category}>
          <div className="shelf-label">
            <b>{shelf.category.toLowerCase()}</b> ({shelf.books.length})
          </div>
          <div className="books">
            {shelf.books.map((t, i) => (
              <span
                className={`book${i === shelf.books.length - 1 && shelf.books.length > 2 ? ' lean' : ''}`}
                key={t.id}
                style={{
                  background: t.color,
                  color: spineTextColor(t.color),
                  height: BOOK_HEIGHTS[i % BOOK_HEIGHTS.length],
                  width: BOOK_WIDTHS[i % BOOK_WIDTHS.length],
                }}
                title={`${t.name} — ${shelfOf(t)}`}
              >
                {t.name}
              </span>
            ))}
          </div>
          <div className="shelf-rail" />
        </div>
      ))}
      <p className="shelf-note">— 지금까지 다뤄 본 기술 {techStack.length}권</p>
    </div>
  )
}

/* 화이트보드 — 예정 프로젝트 (FR-016) */
function FuturePanel() {
  const { plannedProjects } = useRoomContent()

  return (
    <div className="board-surface">
      <h3 className="board-title">개발 예정 프로젝트</h3>
      <p className="board-sub">
        아직 <b>계획 단계</b>예요 — 완성되면 방 안에 자리가 생깁니다
      </p>
      {plannedProjects.length === 0 ? (
        <EmptyNotice what="예정 프로젝트" />
      ) : (
        <ul className="sticky-list">
          {plannedProjects.map((p) => (
            <li className="sticky" key={p.id}>
              <div className="sticky-top">
                <span className="sticky-title">{p.title}</span>
                <span className="sticky-badge">Planned</span>
              </div>
              <div className="sticky-desc p-desc-md">
                <ReactMarkdown>{p.description}</ReactMarkdown>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="board-tray" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>
  )
}

const EYEBROWS: Record<string, string> = {
  laptop: 'current-project',
  bookshelf: 'tech-stack',
  whiteboard: 'coming-soon',
}

const TITLES: Record<string, string> = {
  laptop: '프로젝트',
  bookshelf: '기술 스택',
  whiteboard: '화이트보드',
}

export default function InformationPanel({
  object,
  onClose,
}: {
  object: RoomObjectConfig | null
  onClose: () => void
}) {
  if (!object || object.kind === 'theme') return null

  return (
    <div className="panel-layer">
      <div
        className={`panel kind-${object.kind}`}
        role="dialog"
        aria-modal="false"
        aria-label={object.label}
      >
        {object.kind === 'project' && (
          <div className="win-bar" aria-hidden="true">
            <span className="win-dots">
              <i />
              <i />
              <i />
            </span>
            <span className="win-path">~/projects</span>
            <span className="win-run">
              <i />
              RUNNING
            </span>
          </div>
        )}
        <div className="panel-head">
          <div>
            <span className="panel-eyebrow">
              {EYEBROWS[object.id] ?? object.label}
            </span>
            <span className="panel-title">{TITLES[object.id] ?? object.label}</span>
          </div>
          <button
            type="button"
            className="panel-close"
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        <div className="panel-body">
          {object.kind === 'project' && <ProjectPanel />}
          {object.kind === 'stack' && <StackPanel />}
          {object.kind === 'future' && <FuturePanel />}
        </div>
      </div>
    </div>
  )
}
