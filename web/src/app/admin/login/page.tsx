"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initial: LoginState = {};

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] px-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-center text-2xl font-bold mb-1">
          방문<span className="text-[#fd391f]">예약페이지</span>
        </h1>
        <p className="text-center text-sm text-gray-500 mb-6">관리자 로그인</p>

        <form action={formAction} className="space-y-3">
          <input
            type="text"
            name="username"
            placeholder="아이디"
            autoComplete="username"
            required
            className="w-full h-12 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#fd391f]"
          />
          <input
            type="password"
            name="password"
            placeholder="비밀번호"
            autoComplete="current-password"
            required
            className="w-full h-12 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#fd391f]"
          />

          {state.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full h-12 bg-[#fd391f] hover:bg-[#d22c16] disabled:opacity-60 text-white font-semibold rounded transition-colors"
          >
            {pending ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
