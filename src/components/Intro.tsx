import { useEffect, useState } from 'react'
import { profile } from '../data/content'

/**
 * Intro — 최초 접속 연출 (약 3.4초).
 *   검은 화면 → 현관문이 열림 → 조명(빛)이 켜짐 → Welcome → 메인 화면
 * Skip 버튼으로 즉시 넘어갈 수 있다.
 */
export default function Intro({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setPhase(1), 250), // 문이 열리고 빛이 들어옴
      window.setTimeout(() => setPhase(2), 1500), // Welcome 등장
      window.setTimeout(() => setPhase(3), 2300), // 타이틀 등장
      window.setTimeout(() => setLeaving(true), 3050), // 페이드 아웃 시작
      window.setTimeout(() => onDone(), 3650), // 언마운트
    ]
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [onDone])

  const handleSkip = () => {
    setLeaving(true)
    window.setTimeout(onDone, 400)
  }

  return (
    <div
      className={`intro phase-${phase}${phase >= 1 ? ' open' : ''}${
        leaving ? ' is-leaving' : ''
      }`}
    >
      <div className="intro-glow" />
      <div className="intro-text">
        <div className="intro-boot">
          $ open ~/only-one-room <span className="hint-cursor" aria-hidden="true" />
        </div>
        <div className="intro-welcome">Welcome</div>
        <div className="intro-greet">{profile.greeting}</div>
        <div className="intro-title">only-one-room</div>
      </div>
      <div className="intro-door left">
        <span className="knob" />
      </div>
      <div className="intro-door right">
        <span className="knob" />
      </div>
      <button type="button" className="intro-skip" onClick={handleSkip}>
        Skip ›
      </button>
    </div>
  )
}
