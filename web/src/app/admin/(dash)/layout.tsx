import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function DashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Why: 미들웨어로 1차 차단하되, 서버 컴포넌트에서 실제 계정 존재까지 재확인 (방어적)
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const admin = await prisma.admin.findUnique({
    where: { id: session.adminId },
    select: { username: true },
  });
  if (!admin) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-[#242424] text-white">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/admin" className="font-bold">
            방문<span className="text-[#fd391f]">예약</span> 관리자
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-300">{admin.username}</span>
            <form action="/admin/logout" method="post">
              <button className="text-gray-300 hover:text-white">로그아웃</button>
            </form>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-5 flex gap-6 text-sm">
          <Link href="/admin" className="py-3 hover:text-[#fd391f]">
            대시보드
          </Link>
          <Link href="/admin/reservations" className="py-3 hover:text-[#fd391f]">
            예약 관리
          </Link>
          <Link href="/admin/events" className="py-3 hover:text-[#fd391f]">
            행사 관리
          </Link>
          <Link href="/admin/account" className="py-3 hover:text-[#fd391f]">
            계정 관리
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-5 py-8">{children}</main>
    </div>
  );
}
