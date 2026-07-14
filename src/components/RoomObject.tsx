import type { CSSProperties, MouseEvent } from 'react'
import type { RoomObjectConfig } from '../data/scene'
import type { Theme } from '../context/ThemeContext'

/**
 * RoomObject — 배경 방 이미지 위에 정렬된 인터랙션 "핫스팟".
 *
 * 오브젝트 아트는 배경 이미지에 이미 그려져 있으므로, 여기서는 그 영역을
 * 덮는 투명 버튼만 만든다.
 *   Hover : ro-magnify(같은 배경을 해당 영역만 잘라 확대한 레이어)가 살짝
 *           떠오르며 확대 + 그림자 → "오브젝트가 입체적으로 들리는" 느낌.
 *           동시에 참조 이미지 스타일의 라벨 카드가 나타난다.
 *   Click : 카메라 이동 + 정보 패널(project/stack/future) 또는 테마 토글(theme).
 *
 * 확대 레이어는 배경과 동일한 이미지(var(--room-src))를 사용하되,
 * background-size/position을 box 비율로 계산해 배경과 픽셀 단위로 정렬시킨다.
 */
export default function RoomObject({
  config,
  selectedId,
  onSelect,
  onToggleTheme,
  theme,
}: {
  config: RoomObjectConfig
  selectedId: string | null
  onSelect: (id: string | null) => void
  onToggleTheme: () => void
  theme: Theme
}) {
  const { id, label, hint, icon, box, kind, pin } = config
  const pinStyle = {
    left: `${(pin?.x ?? 0.5) * 100}%`,
    top: `${(pin?.y ?? 0.12) * 100}%`,
  }
  const isSelected = selectedId === id
  const somethingSelected = selectedId !== null
  const isDimmed = somethingSelected && !isSelected

  // box(0~1)를 % 위치로, 그리고 확대 레이어 정렬용 CSS 변수로 전달
  const style = {
    left: `${box.left * 100}%`,
    top: `${box.top * 100}%`,
    width: `${box.width * 100}%`,
    height: `${box.height * 100}%`,
    '--b-left': box.left,
    '--b-top': box.top,
    '--b-w': box.width,
    '--b-h': box.height,
  } as CSSProperties

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    if (kind === 'theme') {
      onToggleTheme()
    } else {
      onSelect(isSelected ? null : id)
    }
  }

  return (
    <button
      type="button"
      className={`room-object ro-${kind} ${id}${isSelected ? ' is-selected' : ''}${
        isDimmed ? ' is-dimmed' : ''
      }`}
      style={style}
      onClick={handleClick}
      aria-label={`${label} — ${hint}`}
      aria-pressed={kind === 'theme' ? theme === 'dark' : isSelected}
    >
      {/* hover 시 해당 영역만 확대되어 떠오르는 레이어 (창문 포함 모든 오브젝트) */}
      <span className="ro-magnify" aria-hidden="true" />


      {/* 평상시: 인터랙션 가능함을 알리는 핀 (오브젝트별 앵커 위치) */}
      {!somethingSelected && (
        <span className="ro-pin" style={pinStyle} aria-hidden="true" />
      )}

      {/* 참조 스타일 라벨 카드 (hover/focus 시 등장) */}
      <span className="ro-card">
        <span className="ro-card-ico" aria-hidden="true">
          {icon}
        </span>
        <span className="ro-card-txt">
          <b className="ro-card-title">{label}</b>
          <i className="ro-card-sub">{hint}</i>
        </span>
      </span>
    </button>
  )
}
