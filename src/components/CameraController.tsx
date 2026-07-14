import type { ReactNode } from 'react'
import type { FocusPoint } from '../data/scene'

/**
 * CameraController — CSS Transform 기반의 "카메라".
 * 선택된 오브젝트의 focus(fx, fy, zoom)를 받아 stage 전체를 확대/이동시켜
 * 해당 오브젝트가 화면의 목표 지점에 오도록 만든다. focus가 null이면 방 전체.
 *
 * 목표 지점: 기본은 화면 중앙(0.5, 0.5)이지만, 정보 패널이 열려 있으면
 * 패널이 가리지 않는 영역의 중앙으로 옮긴다.
 *   데스크톱: 패널이 우측 → 초점을 좌측(x≈0.33)으로
 *   모바일:   패널이 하단 → 초점을 상단(y≈0.36)으로
 *
 * 좌표 유도: 화면의 목표 지점(t)에 초점(f)을 맞추는 변환.
 *   x' = W * (f * Z + T/100)  =>  T = (t - f*Z) * 100
 */
export default function CameraController({
  focus,
  panelOpen,
  panTx,
  children,
}: {
  focus: FocusPoint | null
  panelOpen: boolean
  /**
   * 세로 모바일(스와이프 크롭)에서 선택 순간의 화면 중앙(뷰포트 x 비율).
   * 스크롤을 중앙으로 되돌리는 대신, 사용자가 보던 위치에서 그대로
   * 줌인하도록 목표 지점을 보정한다. 스와이프 불가 화면에서는 null.
   */
  panTx?: number | null
  children: ReactNode
}) {
  const isNarrow =
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 720px)').matches

  const tx = focus && panelOpen && !isNarrow ? 0.33 : (panTx ?? 0.5)
  const ty = focus && panelOpen && isNarrow ? 0.29 : 0.5

  const transform = focus
    ? `translate(${(tx - focus.fx * focus.zoom) * 100}%, ${
        (ty - focus.fy * focus.zoom) * 100
      }%) scale(${focus.zoom})`
    : 'translate(0%, 0%) scale(1)'

  return (
    <div className="stage" style={{ transform }}>
      {children}
    </div>
  )
}
