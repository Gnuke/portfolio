# 방 배경 이미지 스펙

현재 사용 중인 배경:
- `room-day.png`  ← `References/MyRoom/Style/room-day2.png` (1448×1086, 4:3, 낮)
- `room-night.png` ← `References/MyRoom/Style/room-night2.png` (1448×1086, 4:3, 밤)

두 장은 **카메라·구도·가구 배치가 동일한 매칭 페어**이고, **창문 클릭이 낮↔밤(Light/Dark) 토글**입니다.
오브젝트 핫스팟 좌표는 `src/data/scene.ts`에 이 이미지 기준으로 측정돼 있습니다.

## 이미지를 교체/재생성할 때 지켜야 할 것
1. **비율 4:3 고정** (viewport가 4:3). 다르면 `src/styles.css`의 `.viewport aspect-ratio`와 `.viewport width`(`min(100vw,133vh)`)도 함께 바꿔야 함.
2. **day/night은 카메라·가구 배치 100% 동일**하게. (핀/핫스팟이 두 테마에서 같은 위치에 맞아야 함)
3. **텍스트·라벨·UI·워터마크 없이** 방만.
4. 배치가 바뀌면 `src/data/scene.ts`의 box/focus 좌표(정규화 0~1)를 새 이미지에 맞춰 다시 측정.
5. 창문은 테마 토글이므로 **창문이 잘 보이도록** 유지. (벽 스위치가 있으면 그걸 써도 되지만 현재는 창문 사용)

## 해상도 팁
현재 1448px 폭은 카메라 줌(약 2.1~2.3배) 시 살짝 부드러워질 수 있습니다.
더 선명하게 하려면 **같은 구도로 2배 해상도(≈2896×2172)** 로 재생성해 같은 파일명으로 덮어쓰면 됩니다. (좌표는 정규화라 그대로 유효)

## 붙여넣기용 생성 프롬프트 (영문, 참고)
```
A cozy semi-realistic studio apartment of a software developer, eye-level view,
warm minimal mood, 4:3 aspect ratio, high resolution.
Left: fridge, single bed with dark bedding, nightstand with a warm lamp, a red
#30 jersey and scarf on the wall. Center-left: a window with wooden blinds.
Center: a wooden desk with a monitor, an open laptop, a desk lamp, a small speaker,
a PC tower and an office chair; a whiteboard on the wall above the desk. Right: a
tall wooden bookshelf, a standing mirror, the entrance door with shoes, a washing
machine and a small kitchen counter. Front center: a rug with a low wooden coffee
table (mug, tissue box) and a floor cushion.
Soft lighting, gentle shadows, depth and perspective. No text, no labels, no UI.
--- DAY: bright daylight through the window, airy and warm.
--- NIGHT: dark outside with city lights, warm lamp glow, cozy dim atmosphere.
Keep the EXACT same camera, composition and furniture placement between day and night.
```
