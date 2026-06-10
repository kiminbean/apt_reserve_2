# 진행 로그 (PROGRESS)

> 세션 간 맥락 휘발 방지용. 각 작업의 결정사항·산출물·검증 결과 기록.

## 작업 이력

### 1. 정적 클론 (clone/)

`reserve-apt2.co.kr` 전체를 정적 사이트로 복제.

- **메인** `index.html` + 서브페이지 6종: 예약접수(`reserve.html`), 예약확인(`check.html`), 예약취소(`cancel.html`), 공지목록(`notice_list.html`), 공지보기(`notice_view.html`), 관리자로그인(`login.html`)
- **자산**: 원본 CSS를 로컬 호스팅(`clone/assets/`) — `common/layout/mobile.css`, 회원스킨(`member/`), 공지스킨(`notice/`), 예약 달력 플러그인(`booking/`). EUC-KR 깨진 주석은 `iconv -c`로 UTF-8 정리(렌더링 무영향).
- **이미지**: `visual.jpg`, `logo_img`(비주얼 배경), `ft_logo.png`, `arrow.png`
- **예약 달력**: 원본 AJAX 렌더 결과를 스냅샷으로 정적 임베드(잔여석 19/7/2·마감 표시 포함)
- **검증**: 헤드리스 크롬으로 7개 페이지 전수 캡처. 로그인 페이지 mbskin 깨짐 발견 → 회원스킨 CSS(`mobile/skin/member/basic/style.css`) 누락이 원인, 추가 후 정상 복구.

### 2. 풀스택 전환 — 사용자 결정

관리자 계정(ID/비밀번호) 관리 위치 질문에서 출발. AskUserQuestion으로 방향 확정:

- **범위**: 전체 예약 시스템 풀스택
- **스택**: Next.js + Vercel
- **자격증명**: DB 저장 + 관리자 페이지에서 직접 변경

### 3. Phase 1 — 프로젝트 기반 + 관리자 인증/계정관리 ✅

- `web/`에 Next.js 16 스캐폴딩(App Router, src-dir, Tailwind v4, pnpm)
- Prisma 스키마(Admin·Event·TimeSlot·Reservation) + 초기 마이그레이션 + 시드(`admin`/`admin1234`)
- 인증 라이브러리(`src/lib/auth.ts`): bcrypt 해시 + jose JWT httpOnly 쿠키(`admin_session`, 7일)
- 미들웨어(`src/middleware.ts`): `/admin/*` 보호(`login`/`logout` 제외)
- 로그인(서버액션), 보호 영역 `(dash)`(대시보드·계정관리), 로그아웃 라우트
- 계정관리(`/admin/account`): 현재 비번 확인 후 ID·비밀번호 변경

**검증**:
- `pnpm build` 성공(전 라우트 컴파일·타입체크 통과)
- 미인증 `/admin` → 307 로그인 리다이렉트
- 비밀번호 검증 통과 / 오답 거부
- 유효 세션으로 보호 페이지 200 + 본문 정상 렌더
- 로그인 화면 브라우저 캡처 확인

## 핵심 결정 (비자명)

| 결정 | 이유 |
|------|------|
| 앱을 `web/` 서브디렉토리에 배치 | `.omc/` 훅 재생성으로 루트 `create-next-app` 충돌 |
| Prisma **6** 고정(7 아님) | Prisma 7은 datasource `url` 폐기 + driver-adapter 강제 → 마찰. Neon 전환은 6에서도 동일 |
| 로컬 SQLite | 클라우드 자격증명 없이 즉시 개발. 프로덕션은 `DATABASE_URL`만 Neon Postgres로 교체(provider도 postgresql로) |
| NextAuth 대신 경량 커스텀 인증 | 관리자 단일 로그인에 적합, 제어 명확(bcrypt + jose) |
| 정적 `clone/` 보존 | 풀스택 UI 재구현의 디자인 기준 |

## 미해결 / 주의

- Next 16에서 `middleware` → `proxy` 리네임 deprecation 경고(동작 정상, Phase 6에서 정리)
- 기본 비밀번호 `admin1234`, `web/.env`의 `AUTH_SECRET` 실서비스 전 교체 필수
- 프로덕션 전환 시 Prisma provider sqlite→postgresql 변경 + 재마이그레이션 필요

## 다음 단계

Phase 2 — 예약 데이터 모델 활용: 행사(Event)·시간대(TimeSlot)·정원 시드, 관리자 행사 등록 기능 기반 마련.
