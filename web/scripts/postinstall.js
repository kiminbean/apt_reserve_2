#!/usr/bin/env node

/**
 * Prisma postinstall 스크립트.
 * Why: Vercel(Neon Postgres) 배포 시 provider를 자동으로 postgresql로 전환하고
 *   로컬 개발에서는 sqlite를 유지한다. DATABASE_URL 환경변수로 감지한다.
 *   이 스크립트는 pnpm install 시 자동 실행된다 (package.json postinstall).
 */

const { readFileSync, writeFileSync } = require('fs');
const { execSync } = require('child_process');

const dbUrl = process.env.DATABASE_URL || '';
const schemaPath = 'prisma/schema.prisma';

try {
  let schema = readFileSync(schemaPath, 'utf-8');

  if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
    // 프로덕션: PostgreSQL provider로 전환
    if (schema.includes('provider = "sqlite"')) {
      schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
      writeFileSync(schemaPath, schema);
      console.log('[postinstall] PostgreSQL 감지 — provider를 postgresql로 전환');
    }
  } else {
    // 로컬 개발: SQLite 유전 (기본값)
    console.log('[postinstall] 로컬 개발 — SQLite provider 유지');
  }

  // Prisma 클라이언트 생성
  execSync('npx prisma generate', { stdio: 'inherit' });
} catch (err) {
  console.error('[postinstall] 오류:', err.message);
  process.exit(1);
}
