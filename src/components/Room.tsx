import { ROOM_OBJECTS } from '../data/scene'
import type { Theme } from '../context/ThemeContext'
import RoomBackdrop from './art/RoomBackdrop'
import RoomObject from './RoomObject'

/**
 * Room — 방 전체(배경 아트 + 인터랙션 오브젝트 + 조명 레이어).
 * stage(카메라) 안쪽에 위치하므로 카메라 변환의 영향을 함께 받는다.
 */
export default function Room({
  selectedId,
  onSelect,
  onToggleTheme,
  theme,
}: {
  selectedId: string | null
  onSelect: (id: string | null) => void
  onToggleTheme: () => void
  theme: Theme
}) {
  return (
    <>
      {/* 빈 벽/바닥을 클릭하면 선택 해제 */}
      <button
        type="button"
        className="backdrop"
        aria-label="방 전체 보기"
        onClick={() => onSelect(null)}
      >
        <RoomBackdrop />
      </button>

      {ROOM_OBJECTS.map((config) => (
        <RoomObject
          key={config.id}
          config={config}
          selectedId={selectedId}
          onSelect={onSelect}
          onToggleTheme={onToggleTheme}
          theme={theme}
        />
      ))}
    </>
  )
}
