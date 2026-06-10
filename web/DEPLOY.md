# 프로덕션 배포 가이드

## 아키텍처

| 구성요소 | 서비스 | 비고 |
|---------|--------|------|
| 프론트엔드 + API | Vercel | Next.js 서버리스 |
| 데이터베이스 | Neon PostgreSQL | Serverless Postgres |
| 이메일 | Gmail SMTP | Nodemailer (선택) |

## 1. Neon PostgreSQL 설정

### 1-1. 프로젝트 생성

1. [neon.tech](https://neon.tech) 에서 프로젝트 생성
2. 데이터베이스 연결 문자열 복사

### 1-2. Prisma 스키마 수정

프로덕션에서는 PostgreSQL을 사용하도록 `prisma/schema.prisma`를 수정합니다:

```prisma
datasource db {
  provider = "postgresql"    // sqlite → postgresql 변경
  url      = env("DATABASE_URL")
}
```

> **중요**: 로컬 개발은 계속 SQLite를 사용할 수 있습니다.
> 배포 시 환경변수 `DATABASE_URL`이 Neon 연결 문자열로 설정되면 자동으로 PostgreSQL이 사용됩니다.

### 1-3. 마이그레이션 실행

```bash
# 프로덕션 DB에 마이그레이션 적용
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/dbname" npx prisma migrate deploy

# 또는 개발 마이그레이션 생성
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/dbname" npx prisma migrate dev
```

### 1-4. 시드 데이터

```bash
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/dbname" \
SEED_ADMIN_USER="admin" \
SEED_ADMIN_PASS="your-secure-password" \
pnpm db:seed
```

## 2. Vercel 배포

### 2-1. Vercel CLI 설치 (선택)

```bash
pnpm add -g vercel
vercel login
```

### 2-2. 프로젝트 연결

```bash
cd web
vercel link
```

### 2-3. 환경변수 설정

Vercel 대시보드 → Settings → Environment Variables 에서 설정:

| 변수명 | 값 | 필수 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require` | **예** |
| `AUTH_SECRET` | `openssl rand -base64 32` 로 생성 | **예** |
| `SMTP_HOST` | `smtp.gmail.com` | 이메일 사용시 |
| `SMTP_PORT` | `587` | 이메일 사용시 |
| `SMTP_USER` | Gmail 주소 | 이메일 사용시 |
| `SMTP_PASS` | Gmail 앱 비밀번호 | 이메일 사용시 |
| `EMAIL_FROM` | 발신자 이메일 | 이메일 사용시 |
| `ADMIN_EMAIL` | 관리자 알림 수신 이메일 | 이메일 사용시 |

### 2-4. 배포

```bash
# 프리뷰 배포
vercel

# 프로덕션 배포
vercel --prod
```

또는 GitHub 연동 후 자동 배포 설정:
1. Vercel 대시보드 → Import Git Repository
2. Root Directory를 `web`으로 설정
3. Build Command: `pnpm build`
4. Output Directory: `.next`

## 3. Gmail SMTP 설정

### 3-1. 앱 비밀번호 생성

1. Google 계정 → 보안 → 2단계 인증 활성화
2. 앱 비밀번호 → 새 앱 비밀번호 생성
3. 생성된 16자리 비밀번호를 `SMTP_PASS`로 설정

### 3-2. 주의사항

- 일반 Google 비밀번호가 아닌 **앱 비밀번호**를 사용해야 함
- 일일 발송 한도: 약 500통
- 대량 발송이 필요한 경우 Resend, SendGrid 등으로 전환 권장

## 4. 배포 후 확인

```bash
# 사이트 접속 확인
curl -s https://your-domain.vercel.app | head -5

# API 헬스체크
curl -s https://your-domain.vercel.app/api/reservations/event

# 관리자 로그인 확인
curl -s https://your-domain.vercel.app/admin/login | head -5
```

## 5. 커스텀 도메인 (선택)

Vercel 대시보드 → Settings → Domains 에서 도메인 추가.

## 6. 환경변수 체크리스트

```bash
# 필수
echo "DATABASE_URL: ${DATABASE_URL:+설정됨}"
echo "AUTH_SECRET: ${AUTH_SECRET:+설정됨}"

# 이메일 (선택)
echo "SMTP_HOST: ${SMTP_HOST:+설정됨}"
echo "SMTP_USER: ${SMTP_USER:+설정됨}"
echo "SMTP_PASS: ${SMTP_PASS:+설정됨}"
echo "ADMIN_EMAIL: ${ADMIN_EMAIL:+설정됨}"
```

## 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| Prisma 연결 실패 | SSL 모드 미설정 | `?sslmode=require` 추가 |
| 마이그레이션 실패 | provider 불일치 | 프로덕션에서 `postgresql` 사용 확인 |
| 로그인 안 됨 | AUTH_SECRET 누락 | 환경변수 확인 |
| 이메일 미발송 | SMTP 미설정 | SMTP 환경변수 확인 (선택 기능) |
| 빌드 실패 | Prisma generate 미실행 | `postinstall` 스크립트 확인 |
