"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "아이디와 비밀번호를 입력해주세요." };
  }

  const admin = await prisma.admin.findUnique({ where: { username } });
  // Why: 계정 유무를 노출하지 않도록 동일한 메시지로 처리
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    return { error: "아이디 또는 비밀번호가 올바르지 않습니다." };
  }

  await createSession(admin.id);
  redirect("/admin");
}
