/**
 * 방(Scene)의 좌표계와 인터랙션 오브젝트 배치 정보.
 *
 * 배경은 렌더링된 방 이미지(3:2, /public/room/room-day|night.png) 1장이며,
 * 인터랙션 오브젝트는 그 이미지 위에 정렬된 "핫스팟(투명 버튼)"이다.
 * 모든 좌표는 이미지 크기와 무관하도록 0~1 정규화 비율로 표기한다.
 *   box   : 이미지 대비 오브젝트 영역 (left/top/width/height, 0~1)
 *   focus : 클릭 시 카메라가 화면 중앙에 맞출 지점(fx, fy)과 확대 배율(zoom)
 *
 * 좌표는 최종 배경(room-day2 / room-night2, 1448x1086 = 4:3) 기준으로 측정됐다.
 * 배경 이미지를 바꾸면 이 값들만 다시 맞추면 된다.
 */

/** 배경 이미지 종횡비 (4:3) — viewport와 동일하게 유지 */
export const ROOM_ASPECT = 4 / 3

export interface FocusPoint {
  /** 0~1 (이미지 x 비율) */
  fx: number
  /** 0~1 (이미지 y 비율) */
  fy: number
  /** 카메라 확대 배율 */
  zoom: number
}

export interface Box {
  /** 모두 0~1 정규화 비율 */
  left: number
  top: number
  width: number
  height: number
}

export type ObjectKind = 'project' | 'stack' | 'future' | 'theme'

export interface RoomObjectConfig {
  id: string
  /** hover 라벨 카드의 제목 */
  label: string
  /** hover 라벨 카드의 부제 */
  hint: string
  /** 라벨 카드/핀에 쓰는 아이콘(이모지) */
  icon: string
  kind: ObjectKind
  box: Box
  /** theme 토글 오브젝트는 카메라 이동이 없으므로 null */
  focus: FocusPoint | null
  /**
   * 핀(빨간 마커)이 놓이는 지점. box 내부 기준 0~1 비율.
   * 오브젝트의 가장 대표적인 부분 위에 오도록 개별 조정한다. (미지정 시 상단 중앙)
   */
  pin?: { x: number; y: number }
}

export const ROOM_OBJECTS: RoomObjectConfig[] = [
  {
    id: 'laptop',
    label: '노트북',
    hint: '현재 진행 중인 프로젝트',
    icon: '💻',
    kind: 'project',
    box: { left: 0.391, top: 0.331, width: 0.177, height: 0.125 },
    // 노트북/모니터 화면에 초점
    focus: { fx: 0.52, fy: 0.41, zoom: 2.1 },
    pin: { x: 0.62, y: 0.5 }, // 모니터와 노트북 사이
  },
  {
    id: 'bookshelf',
    label: '책장',
    hint: '기술 스택 & 학습 기록',
    icon: '📚',
    kind: 'stack',
    box: { left: 0.598, top: 0.252, width: 0.073, height: 0.277 },
    focus: { fx: 0.635, fy: 0.39, zoom: 2.3 },
    pin: { x: 0.5, y: 0.52 }, // 책이 꽂힌 중앙
  },
  {
    id: 'whiteboard',
    label: '화이트보드',
    hint: '개발 예정 프로젝트',
    icon: '📝',
    kind: 'future',
    box: { left: 0.429, top: 0.158, width: 0.154, height: 0.157 },
    focus: { fx: 0.5, fy: 0.237, zoom: 2.3 },
    pin: { x: 0.5, y: 0.55 }, // 보드 중앙
  },
  {
    // 이미지2에는 벽 스위치가 없어, 창문을 낮/밤(Light/Dark) 토글로 사용한다.
    id: 'window',
    label: '창문',
    hint: '낮 ↔ 밤 (Light / Dark)',
    icon: '🌗',
    kind: 'theme',
    box: { left: 0.186, top: 0.101, width: 0.203, height: 0.283 },
    focus: null,
    pin: { x: 0.5, y: 0.63 }, // 유리창(블라인드 아래) 위
  },
]
