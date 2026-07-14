/**
 * RoomBackdrop — 방의 배경(렌더링된 2.5D 방 이미지).
 *
 * 손으로 그린 SVG 대신, 원근감·조명·질감이 살아 있는 래스터 렌더 이미지를 사용한다.
 * day / night 두 장을 겹쳐 두고 테마에 따라 CSS로 크로스페이드한다.
 * (day/night 이미지는 /public/room/ 에 위치, 3:2 비율)
 *
 * 조명 그레이딩(따뜻한 램프광 · 비네트)은 형제 요소 .ambient 및
 * 이 안의 오버레이가 담당하므로, 이미지 자체는 순수 배경으로만 쓴다.
 */
export default function RoomBackdrop() {
  return (
    <div className="room-photo" aria-hidden="true">
      <img className="room-layer day" src="/room/room-day.png" alt="" draggable={false} />
      <img className="room-layer night" src="/room/room-night.png" alt="" draggable={false} />
      {/* 이미지 위 미세 그레이딩 (테마별) */}
      <div className="room-grade" />
    </div>
  )
}
