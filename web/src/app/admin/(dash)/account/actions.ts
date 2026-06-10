"use server";

import { getSession, verifyPassword, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type AccountState = { error?: string; success?: string };

export async function updateAccountAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const session = await getSession();
  if (!session) return { error: "세션이 만료되었습니다. 다시 로그인해주세요." };

  const admin = await prisma.admin.findUnique({ where: { id: session.adminId } });
  if (!admin) return { error: "계정을 찾을 수 없습니다." };

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newUsername = String(formData.get("username") ?? "").trim();
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  // 현재 비밀번호 검증 (모든 변경의 전제)
  if (!currentPassword || !(await verifyPassword(currentPassword, admin.passwordHash))) {
    return { error: "현재 비밀번호가 올바르지 않습니다." };
  }

  if (!newUsername) return { error: "아이디를 입력해주세요." };

  // 아이디 중복 검사 (본인 제외)
  if (newUsername !== admin.username) {
    const dup = await prisma.admin.findUnique({ where: { username: newUsername } });
    if (dup) return { error: "이미 사용 중인 아이디입니다." };
  }

  const data: { username: string; passwordHash?: string } = { username: newUsername };

  // 비밀번호 변경은 선택 사항 (입력 시에만)
  if (newPassword || confirmPassword) {
    if (newPassword.length < 8) {
      return { error: "새 비밀번호는 8자 이상이어야 합니다." };
    }
    if (newPassword !== confirmPassword) {
      return { error: "새 비밀번호 확인이 일치하지 않습니다." };
    }
    data.passwordHash = await hashPassword(newPassword);
  }

  await prisma.admin.update({ where: { id: admin.id }, data });

  return {
    success: data.passwordHash
      ? "아이디/비밀번호가 변경되었습니다."
      : "아이디가 변경되었습니다.",
  };
}
