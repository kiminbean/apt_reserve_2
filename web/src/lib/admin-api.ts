import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Why: 관리자 API 라우트에서 세션 검증을 공통 처리하는 헬퍼.
// 미들웨어로 1차 차단하지만 API 레벨에서도 재검증하여 이중 보호.

const COOKIE_NAME = "admin_session";

/**
 * 관리자 세션을 검증하고 adminId를 반환.
 * 유효하지 않으면 에러 응답을 반환하여 호출측에서 즉시 return 할 수 있게 함.
 */
export async function requireAdmin(): Promise<
  { ok: true; adminId: number } | { ok: false; response: NextResponse }
> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 }),
    };
  }

  const raw = process.env.AUTH_SECRET?.trim();
  if (!raw) {
    return {
      ok: false,
      response: NextResponse.json({ error: "서버 설정 오류" }, { status: 500 }),
    };
  }

  let adminId: number;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(raw));
    adminId = Number(payload.adminId);
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "세션이 만료되었습니다." }, { status: 401 }),
    };
  }

  // DB에 실제 계정 존재 여부 확인 (방어적 검증)
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: { id: true },
  });
  if (!admin) {
    return {
      ok: false,
      response: NextResponse.json({ error: "유효하지 않은 계정입니다." }, { status: 401 }),
    };
  }

  return { ok: true, adminId };
}
