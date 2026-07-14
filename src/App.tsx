import { useEffect, useRef, useState } from 'react'
import { useTheme } from './context/ThemeContext'
import { ROOM_OBJECTS } from './data/scene'
import { profile } from './data/content'
import Intro from './components/Intro'
import CameraController from './components/CameraController'
import Room from './components/Room'
import InformationPanel from './components/InformationPanel'

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const [introDone, setIntroDone] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)

  const selectedObject =
    ROOM_OBJECTS.find((o) => o.id === selectedId) ?? null
  const focus = selectedObject?.focus ?? null
  const panelOpen = selectedObject !== null && selectedObject.kind !== 'theme'

  // Esc 로 방 전체 보기 복귀
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // 세로 모바일: 방이 화면보다 넓게 크롭되므로 좌우 스와이프로 둘러본다.
  // 시작 위치는 방 중앙.
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
  }, [])

  // 오브젝트 선택 시 카메라 줌의 기준(뷰포트 중앙)이 화면 중앙과 일치하도록
  // 스크롤을 중앙으로 복귀시킨다.
  useEffect(() => {
    if (!selectedId) return
    const el = scrollerRef.current
    if (!el) return
    el.scrollTo?.({
      left: (el.scrollWidth - el.clientWidth) / 2,
      behavior: 'smooth',
    })
  }, [selectedId])

  return (
    <div className="app">
      {!introDone && <Intro onDone={() => setIntroDone(true)} />}

      <div className="viewport-scroller" ref={scrollerRef}>
        <div className="viewport">
          <CameraController focus={focus} panelOpen={panelOpen}>
            <Room
              selectedId={selectedId}
              onSelect={setSelectedId}
              onToggleTheme={toggleTheme}
              theme={theme}
            />
          </CameraController>
        </div>
      </div>

      {/* HUD — viewport 밖(화면 기준)에 배치해 모바일 크롭 시에도 항상 보이게 한다 */}
      <div className="hud">
        {/* 안내 힌트 — 터미널 프롬프트 (오브젝트 선택 시 숨김) */}
        <div className={`hint${selectedId ? ' is-hidden' : ''}`}>
          <span className="hint-prompt">gnuke@room:~$</span>
          <span className="hint-text-desktop">오브젝트를 클릭해 방을 둘러보세요</span>
          <span className="hint-text-mobile">밀어서 둘러보고, 탭해서 살펴보세요</span>
          <span className="hint-cursor" aria-hidden="true" />
        </div>

        {/* 이름표 (프로필 · GitHub 링크) */}
        <a
          className={`nameplate${selectedId ? ' is-hidden' : ''}`}
          href={profile.links[0]?.href}
          target="_blank"
          rel="noreferrer"
          title={profile.greeting}
        >
          <span className="nameplate-name">{profile.name}</span>
          <span className="nameplate-role">
            {'// '}
            {profile.role.toLowerCase()} · <em>github ↗</em>
          </span>
        </a>

        {/* 방으로 돌아가기 */}
        {selectedId && (
          <button
            type="button"
            className="back-button"
            onClick={() => setSelectedId(null)}
          >
            ← 방 전체 보기 <kbd>esc</kbd>
          </button>
        )}

        {/* 테마 표시 (창문 클릭과 동일 동작) */}
        <button
          type="button"
          className="theme-badge"
          onClick={toggleTheme}
          aria-label="테마 전환"
        >
          theme: <b>{theme === 'light' ? '☀ day' : '☾ night'}</b>
        </button>

        {/* 정보 패널 (Glassmorphism) */}
        <InformationPanel
          object={selectedObject}
          onClose={() => setSelectedId(null)}
        />
      </div>
    </div>
  )
}
