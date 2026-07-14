# Gnuke's Portfolio 🏠

개발자의 자취방을 탐험하는 인터랙티브 포트폴리오 홈페이지.
Navigation Bar 없이, 방 안의 오브젝트를 클릭해 프로젝트를 둘러봅니다.

실제 자취방 사진(`References/MyRoom`)을 참고해 2.5D로 재해석했습니다 —
맨유 유니폼(#30) + UTD 머플러, 원목 테이블, 그레이 블라인드 창문 등.

## 실행

```bash
npm install
npm run dev        # 방문자: http://localhost:5173 · 관리자: http://localhost:5173/admin.html
```

Supabase 접속 정보가 필요합니다 — 프로젝트 루트에 `.env.local`:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

기타 스크립트

```bash
npm run build      # 프로덕션 빌드 (dist/ — index.html + admin.html 두 엔트리)
npm run preview    # 빌드 결과 미리보기
npm run typecheck  # 타입 검사
npm test           # Vitest 전체 실행
npm run test:watch # TDD 감시 모드
```

## 조작 방법

| 오브젝트 | 동작 |
|----------|------|
| 💻 노트북 | 카메라가 앞으로 이동 → 현재 진행 중인 프로젝트(Melolist-v3) |
| 📚 책장 | 사용 가능한 기술 스택 |
| 📋 화이트보드 | 개발 예정 프로젝트 (Work in Progress) |
| 🔌 벽 스위치 | Light / Dark 테마 전환 (방 전체 분위기 변경) |

- Hover: 오브젝트 확대 + 밝기 + 그림자
- Click: 카메라 이동 + 정보 패널(Glassmorphism)
- 빈 벽 클릭 또는 `← 방으로 돌아가기`로 전체 방 보기 복귀

## 콘텐츠 관리 (관리자 페이지)

방 안의 콘텐츠(프로젝트·예정 프로젝트·기술 스택)는 **관리자 페이지에서
관리**하며 Supabase에 저장됩니다:

> **`/admin.html`** — 관리자 로그인(단일 계정, Supabase Auth) 후
>
> - **프로젝트** — 제목 / 설명(마크다운) / 상태(진행 중·완성·예정) / 기술 /
>   링크 / 표시 순서 / 스크린샷 이미지(파일당 5MB, 최대 10장, 대표 지정)
> - **기술 스택** — 책장에 표시되는 기술 목록
>
> 진행 중·완성 → 노트북, 예정 → 화이트보드, 기술 스택 → 책장에 반영됩니다.
> 관리자 계정은 Supabase 대시보드에서 생성하며 가입 기능은 없습니다.

방문자 화면은 원격 데이터 실패 시 **마지막 성공 캐시 → 내장 정적 데이터**
순으로 조용히 폴백합니다. `src/data/content.ts`는 이제 이 **정적 폴백**
데이터이며, `profile`(이름표)은 여전히 이 파일에서 수정합니다.

방 배치/카메라 좌표는 `src/data/scene.ts` 에서 조정합니다.
DB 스키마는 `supabase/migrations/`, 설계 문서는 `specs/002-admin-project-cms/`
참고.

## 구조

```
src/
├── main.tsx
├── App.tsx                     # 상태 소유: intro / theme / selected(카메라) / panel
├── styles.css                  # 테마 토큰 + 레이아웃 + 카메라 + 패널 + 인트로
├── context/ThemeContext.tsx    # ThemeProvider (Light/Dark)
├── data/
│   ├── content.ts              # ← 콘텐츠 (여기만 수정)
│   └── scene.ts                # 방 좌표계 + 오브젝트 배치
└── components/
    ├── Intro.tsx               # 최초 접속 연출
    ├── CameraController.tsx    # CSS Transform 카메라
    ├── Room.tsx                # 방 전체
    ├── RoomObject.tsx          # 오브젝트 hover/click 래퍼
    ├── InformationPanel.tsx    # Glassmorphism 정보 패널
    └── art/                    # SVG 2.5D 아트
        ├── RoomBackdrop.tsx    #   벽/바닥/창문/조명/침대/유니폼/테이블
        ├── Laptop.tsx
        ├── Bookshelf.tsx
        ├── Whiteboard.tsx
        └── WallSwitch.tsx
```

## 구현 범위 / 향후 확장

- PRD(`prd.md`) 기준 MVP 완료 (명세 001)
- **Supabase 연동 + 관리자 CMS 완료** (명세 002): 프로젝트 CRUD, 이미지
  업로드, 노트북 패널 다중 프로젝트 전환(◂ ▸), 이미지 갤러리, 마크다운 설명
- 남은 향후 계획: Vercel 배포, 방 커스터마이징, 방 템플릿, AI 방 생성
