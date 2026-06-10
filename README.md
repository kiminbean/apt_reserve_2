# 방문예약페이지 (apt_reserve_2)

`reserve-apt2.co.kr`(그누보드 기반 아파트 방문예약 사이트)의 **정적 클론**과, 이를 자체 서버에서 독립 운영하기 위한 **Next.js 풀스택 재구현**.

## 저장소 구조

```
apt_reserve_2/
├── web/        Next.js 16 풀스택 앱 (실서비스 대상)
├── clone/      원본 정적 클론 (디자인 레퍼런스 / 시각 기준)
└── docs/       진행 로그·결정사항 문서
```

> `web/`를 서브디렉토리에 둔 이유: `.omc/`가 세션 훅으로 매번 재생성되어 루트에서 `create-next-app` 충돌이 발생하기 때문.

## 기술 스택

- **Next.js 16.2.9** (App Router, `src/`, Server Actions) + **React 19**
- **Tailwind CSS v4**
- **Prisma 6.19.3** ORM — 로컬 SQLite, 프로덕션은 Neon Postgres 전환 예정
- **인증**: bcryptjs(비밀번호 해시) + jose(JWT httpOnly 세션 쿠키)
- **패키지 매니저**: pnpm

## 빠른 시작

```bash
cd web
pnpm install
pnpm exec prisma migrate dev      # DB 스키마 생성
pnpm exec prisma db seed          # 최초 관리자 계정 생성
pnpm dev                          # http://localhost:3000
```

### 관리자 접속

- 로그인: `http://localhost:3000/admin/login`
- 최초 계정: **`admin` / `admin1234`**
- 로그인 후 `/admin/account`에서 ID·비밀번호 직접 변경 (현재 비밀번호 확인 필수)

> 기본 비밀번호와 `web/.env`의 `AUTH_SECRET`은 실서비스 전 반드시 교체.

## 데이터 모델 (Prisma)

| 모델 | 설명 |
|------|------|
| `Admin` | 관리자 계정 (username, passwordHash, isSuper) |
| `Event` | 행사(아파트 방문 이벤트) — title, 기간 |
| `TimeSlot` | 날짜별 시간대 슬롯 — date, label, capacity(정원) |
| `Reservation` | 예약 접수 — 이름/동/호/연락처/인원/상태 |

## 진행 단계

| Phase | 내용 | 상태 |
|-------|------|------|
| 1 | 프로젝트 기반 + 관리자 인증/계정관리 | ✅ 완료 |
| 2 | 예약 데이터 모델 + 행사/시간대/정원 시드 | 예정 |
| 3 | 공개 예약접수 (달력·시간대·인원 선택) | 예정 |
| 4 | 예약확인 / 취소 로직 | 예정 |
| 5 | 관리자 대시보드 (예약 조회·잔여석 관리) | 예정 |
| 6 | Vercel 배포 + Neon Postgres 전환 | 예정 |

자세한 결정사항·세션 로그는 [`docs/PROGRESS.md`](docs/PROGRESS.md) 참조.
