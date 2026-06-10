# APT Reserve 2 - 프로젝트 구조

## 최상위 디렉토리

```
apt_reserve_2/
├── web/          Next.js 16 풀스택 앱 (실서비스 대상)
├── clone/        원본 정적 클론 (디자인 레퍼런스 / 시각 기준)
├── docs/         진행 로그 · 결정사항 문서
├── .claude/      MoAI-ADK 설정 (에이전트, 명령, 훅, 규칙, 스킬)
├── .moai/        MoAI 프로젝트 메타 (설정, 브랜드, 디자인, DB 문서)
└── .omc/         OMC 로컬 상태 (git 추적 제외)
```

## web/ - Next.js 앱 구조

```
web/
├── prisma/
│   ├── schema.prisma       데이터 모델 (Admin, Event, TimeSlot, Reservation)
│   ├── seed.ts              시드 스크립트 (관리자 계정, 샘플 데이터)
│   └── dev.db               SQLite 개발 DB (git 추적 제외)
│
├── src/
│   ├── app/                 App Router 페이지 및 API 라우트
│   │   ├── page.tsx         공개 홈페이지
│   │   ├── layout.tsx       루트 레이아웃
│   │   ├── globals.css      전역 스타일 (Tailwind)
│   │   │
│   │   ├── admin/           관리자 영역
│   │   │   ├── login/       로그인 페이지 + Server Action
│   │   │   ├── logout/      로그아웃 API 라우트
│   │   │   └── (dash)/      대시보드 레이아웃 + 페이지
│   │   │       ├── page.tsx           대시보드 홈 (통계)
│   │   │       ├── account/           계정 관리 (비밀번호 변경)
│   │   │       ├── events/            행사 관리
│   │   │       └── reservations/      예약 관리
│   │   │
│   │   ├── reserve/         공개 예약 영역
│   │   │   ├── page.tsx     예약 접수 페이지
│   │   │   ├── check/       예약 확인 페이지
│   │   │   └── cancel/      예약 취소 페이지
│   │   │
│   │   └── api/             API 라우트
│   │       ├── admin/       관리자 전용 API
│   │       │   ├── events/          행사 CRUD
│   │       │   ├── reservations/    예약 관리
│   │       │   ├── slots/           시간대 관리
│   │       │   └── stats/           통계 조회
│   │       └── reservations/  공개 예약 API
│   │           ├── route.ts         예약 생성
│   │           ├── event/           이벤트별 조회
│   │           ├── lookup/          연락처 조회
│   │           └── [id]/cancel/     예약 취소
│   │
│   ├── components/          React 컴포넌트
│   │   └── reservation/     예약 관련 컴포넌트
│   │       ├── Calendar.tsx          달력 선택
│   │       ├── TimeSlotSelector.tsx  시간대 선택
│   │       └── ReservationForm.tsx   예약 폼
│   │
│   ├── lib/                 유틸리티 라이브러리
│   │   ├── auth.ts          인증 (JWT 생성/검증, bcrypt)
│   │   ├── db.ts            Prisma 클라이언트 싱글톤
│   │   ├── admin-api.ts     관리자 API 헬퍼
│   │   ├── email.ts         이메일 발송 (nodemailer)
│   │   └── reservations.ts  예약 비즈니스 로직
│   │
│   ├── types/               TypeScript 타입 정의
│   │   └── reservation.ts   예약 관련 타입
│   │
│   ├── middleware.ts        Next.js 미들웨어 (관리자 경로 보호)
│   │
│   └── __tests__/           테스트 파일
│       ├── setup.ts         테스트 설정
│       ├── api/             API 테스트
│       └── lib/             라이브러리 테스트
│
├── e2e/                     E2E 테스트 (Playwright)
│   └── reservation.spec.ts  예약 플로우 테스트
│
├── public/                  정적 에셋
├── package.json             의존성 및 스크립트
├── next.config.ts           Next.js 설정
├── tsconfig.json            TypeScript 설정
├── vitest.config.ts         Vitest 단위 테스트 설정
├── playwright.config.ts     Playwright E2E 테스트 설정
└── eslint.config.mjs        ESLint 설정
```

## clone/ - 정적 클론 구조

```
clone/
├── index.html           메인 페이지 (예약 폼)
├── reserve.html         예약 접수 페이지
├── check.html           예약 확인 페이지
├── cancel.html          예약 취소 페이지
├── login.html           관리자 로그인
├── notice_list.html     공지사항 목록
├── notice_view.html     공지사항 상세
├── css/                 공통 스타일
├── assets/              원본 에셋 (CSS, 이미지)
│   ├── booking/         예약 페이지 스타일
│   ├── member/          회원 스타일
│   └── notice/          공지 스타일
├── img/                 이미지 리소스
└── data/                원본 데이터 파일
```

## .moai/ 프로젝트 메타

```
.moai/
├── config/sections/     설정 섹션 (언어, DB, 품질, Git 등)
├── project/
│   ├── brand/           브랜드 컨텍스트 (보이스, 비주얼, 타겟)
│   └── db/              DB 문서 (스키마, ERD, 마이그레이션)
├── design/              디자인 브리프 (리서치, 시스템, 스펙)
├── docs/                프로젝트 문서 (MCP, OAuth 설정)
├── evolution/           진화 관리
├── learning/            학습 관리
├── logs/                세션 트레이스 로그
├── specs/               SPEC 문서
└── state/               런타임 상태
```
