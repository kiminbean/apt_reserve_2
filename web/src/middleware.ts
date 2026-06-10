import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Why: 미들웨어는 Edge 런타임 → bcrypt/prisma 사용 불가. jose만으로 세션 토큰 검증
const COOKIE_NAME = "admin_session";

async function isAuthed(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const raw = process.env.AUTH_SECRET?.trim();
  if (!raw) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(raw));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 로그인 페이지와 로그아웃은 보호 대상에서 제외
  if (pathname === "/admin/login" || pathname === "/admin/logout") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!(await isAuthed(req))) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
