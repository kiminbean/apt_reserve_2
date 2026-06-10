# APT Reserve 2 - 기술 스택

## 코어 프레임워크

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 16.2.9 | 풀스택 프레임워크 (App Router, Server Actions) |
| React | 19.2.4 | UI 라이브러리 |
| TypeScript | ^5 | 타입 안전성 |

## 프론트엔드

| 기술 | 버전 | 용도 |
|------|------|------|
| Tailwind CSS | v4 | 유틸리티 우선 스타일링 |
| PostCSS | - | CSS 처리 파이프라인 |
| React Compiler | 1.0.0 | 자동 성능 최적화 (babel-plugin-react-compiler) |

## 백엔드 & 데이터

| 기술 | 버전 | 용도 |
|------|------|------|
| Prisma | 6.19.3 | ORM (SQLite 개발, Neon Postgres 프로덕션 예정) |
| bcryptjs | ^3.0.3 | 비밀번호 해시 |
| jose | ^6.2.3 | JWT httpOnly 세션 쿠키 |
| nodemailer | ^8.0.10 | 이메일 발송 (예약 확인/취소 알림) |

## 테스트

| 기술 | 버전 | 용도 |
|------|------|------|
| Vitest | ^4.1.8 | 단위 테스트 러너 |
| Testing Library | ^16.3.2 | React 컴포넌트 테스트 |
| Playwright | ^1.60.0 | E2E 테스트 |
| jsdom | ^29.1.1 | 브라우저 환경 시뮬레이션 |

## 개발 도구

| 기술 | 버전 | 용도 |
|------|------|------|
| pnpm | - | 패키지 매니저 |
| ESLint | ^9 | 코드 린팅 (flat config) |
| tsx | ^4.22.4 | TypeScript 실행 (시드 스크립트) |

## 인증 아키텍처

```
로그인 요청 → bcrypt.compare(비밀번호 검증)
            → jose.SignJWT(JWT 생성)
            → httpOnly 쿠키 설정 (세션)

미들웨어     → jose.jwtVerify(토큰 검증)
            → /admin/* 경로 보호
```

- 세션 전략: JWT 기반 stateless (DB 세션 없음)
- 쿠키: httpOnly, Secure, SameSite=Lax
- 비밀번호: bcrypt 해시 저장

## 데이터베이스 전환 계획

| 환경 | DB | 연결 |
|------|-----|------|
| 개발 | SQLite (`web/prisma/dev.db`) | `file:./dev.db` |
| 프로덕션 (예정) | Neon Postgres | `DATABASE_URL` 환경변수 |

Prisma 마이그레이션으로 스키마 관리. `provider`를 `sqlite`에서 `postgresql`로 변경 후 재마이그레이션 예정.

## 배포 계획 (Phase 6)

- **플랫폼**: Vercel
- **DB**: Neon Postgres (Serverless)
- **환경변수**: `DATABASE_URL`, `AUTH_SECRET`, `SMTP_*`

## 아키텍처 다이어그램

```
Browser
  │
  ├── 공개 페이지 (/)
  │   ├── 예약 접수 (/reserve)
  │   ├── 예약 확인 (/reserve/check)
  │   └── 예약 취소 (/reserve/cancel)
  │
  └── 관리자 (/admin)
      ├── 로그인 (/admin/login)
      ├── 대시보드 (/admin)
      ├── 행사 관리 (/admin/events)
      ├── 예약 관리 (/admin/reservations)
      └── 계정 관리 (/admin/account)
           │
           ▼
    Next.js App Router
    ├── Server Components (페이지)
    ├── Server Actions (폼 제출)
    ├── API Routes (CRUD)
    └── Middleware (인증 가드)
           │
           ▼
    Prisma ORM → SQLite / Neon Postgres
```
