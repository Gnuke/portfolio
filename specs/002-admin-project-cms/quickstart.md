# Quickstart: 관리자 프로젝트 콘텐츠 관리 — 검증 가이드

**Plan**: [plan.md](./plan.md) | **계약**: [contracts/](./contracts/)

## 사전 준비

1. **Supabase 마이그레이션 적용** — MCP `apply_migration` 3건
   ([contracts/database.md](./contracts/database.md) 순서대로). 적용 후
   `list_tables`로 projects/project_images/tech_stack 확인.
2. **관리자 계정 프로비저닝** (대시보드 수동, 1회):
   - Authentication → Sign In / Up → *Allow new users to sign up* **OFF**
   - Authentication → Users → *Add user* → 이메일/비밀번호 생성
3. **환경 변수** — 프로젝트 루트 `.env.local` (gitignore 확인):

   ```env
   VITE_SUPABASE_URL=https://onaormuhkjekmcezeccn.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_QVyZxGI_9Zyn6moAIUHo1Q_klu7oZ35
   ```

4. 의존성 설치: `npm install` (`@supabase/supabase-js`, `react-markdown` 포함)

## 자동 검증 (완료 게이트 — 헌법 원칙 V)

```bash
npm test               # 전체 테스트 그린
npm run typecheck      # 타입 오류 0
npm run build          # 방문자+관리자 두 엔트리 빌드 성공
```

## 수동 검증 시나리오 (dev: `npm run dev`)

### US1 — 로그인/접근 제어

1. `http://localhost:5173/admin.html` 접속 → 로그인 화면만 보임 (관리 기능
   비노출)
2. 틀린 비밀번호 → "이메일 또는 비밀번호가 올바르지 않습니다" (원인 미특정)
3. 올바른 자격 증명 → 대시보드 진입
4. 로그아웃 → 다시 로그인 화면
5. `http://localhost:5173/` (방문자 화면) → 관리자 진입 링크/버튼이 어디에도
   없음

### US2 — 프로젝트/기술 스택 CRUD

1. 새 프로젝트: 제목·설명(마크다운)·상태 입력 → 저장 → 목록에 상태 배지와
   함께 표시
2. 필수 항목 비우고 저장 → 누락 필드 안내, 저장 거부
3. 상태 전환 (진행 중 → 완성 → 예정) → 목록 반영
4. 삭제 → 확인 절차 후 목록에서 제거
5. 기술 스택 추가/수정/삭제 → 목록 반영

### US3 — 이미지 업로드

1. PNG 업로드 → 미리보기 표시, 저장 후 프로젝트에 연결
2. PDF/6MB 파일 → 거부 + 허용 형식·용량 안내
3. 이미지 2장 중 1장 대표 지정 → 방문자 화면에서 대표가 먼저 노출
4. 이미지 삭제 → 프로젝트에서 제거

### US4 — 방문자 반영/폴백

1. 관리자에서 프로젝트 2건(진행 중 1, 완성 1) 등록 → 방문자 화면 새로고침 →
   노트북 클릭 → 진행 중이 먼저, 상태 배지 표시, ◂ ▸로 전환
2. 이미지 여러 장 프로젝트 → 패널 갤러리에서 대표부터 이전/다음 넘김
3. 예정 프로젝트 등록 → 화이트보드에 표시 / 기술 스택 → 책장에 표시
4. **폴백**: dev 서버는 켠 채 Supabase 접근만 차단 — 실제 인터넷(Wi-Fi)을
   끄거나, 개발자 도구 Network에서 supabase.co 요청 우클릭 → "Block request
   domain". (주의: DevTools의 Offline 토글은 localhost 문서 요청까지 막아
   페이지가 안 열리므로 사용 금지.) 차단 후 새로고침 → 직전 콘텐츠(캐시)가
   조용히 표시. localStorage 키 `oor-content-cache-v1` 삭제 후 다시 새로고침
   → 내장 정적 데이터 표시. 어느 경우든 빈 화면·장애 안내 없음
5. 저장소 정상 + 프로젝트 0건 → 노트북 패널에 "준비 중" 안내

## 성공 기준 대응표

| SC | 검증 방법 |
|----|-----------|
| SC-001 | US2-1 + US3-1을 이어서 5분 내 완료 |
| SC-002 | US1-1/2/4 + RLS(로그아웃 상태 쓰기 거부는 레포지토리 테스트) |
| SC-003 | US4-1/3 |
| SC-004 | US3-2 |
| SC-005 | US4-4/5 |
| SC-006 | US2 각 작업의 완료 피드백 체감 확인 |
| SC-007 | US4-1 (페이지 이동 0회 — 주소창 불변) |
