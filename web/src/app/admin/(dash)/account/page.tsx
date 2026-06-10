import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AccountForm from "./AccountForm";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const admin = await prisma.admin.findUnique({
    where: { id: session.adminId },
    select: { username: true },
  });
  if (!admin) redirect("/admin/login");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">계정 관리</h1>
      <p className="text-sm text-gray-600">
        관리자 아이디와 비밀번호를 직접 변경할 수 있습니다. 모든 변경에는 현재
        비밀번호 확인이 필요합니다.
      </p>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <AccountForm username={admin.username} />
      </div>
    </div>
  );
}
