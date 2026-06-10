"use client";

import { useActionState } from "react";
import { updateAccountAction, type AccountState } from "./actions";

const initial: AccountState = {};

export default function AccountForm({ username }: { username: string }) {
  const [state, formAction, pending] = useActionState(updateAccountAction, initial);

  const inputCls =
    "w-full h-11 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#fd391f]";

  return (
    <form action={formAction} className="space-y-5 max-w-md">
      <div>
        <label className="block text-sm font-medium mb-1">아이디</label>
        <input
          type="text"
          name="username"
          defaultValue={username}
          required
          className={inputCls}
        />
      </div>

      <hr className="border-gray-200" />

      <div>
        <label className="block text-sm font-medium mb-1">
          새 비밀번호 <span className="text-gray-400">(변경 시에만 입력, 8자 이상)</span>
        </label>
        <input
          type="password"
          name="newPassword"
          autoComplete="new-password"
          placeholder="새 비밀번호"
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">새 비밀번호 확인</label>
        <input
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="새 비밀번호 확인"
          className={inputCls}
        />
      </div>

      <hr className="border-gray-200" />

      <div>
        <label className="block text-sm font-medium mb-1">
          현재 비밀번호 <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          name="currentPassword"
          autoComplete="current-password"
          placeholder="본인 확인을 위해 현재 비밀번호 입력"
          required
          className={inputCls}
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-11 px-6 bg-[#fd391f] hover:bg-[#d22c16] disabled:opacity-60 text-white font-semibold rounded transition-colors"
      >
        {pending ? "저장 중..." : "변경 저장"}
      </button>
    </form>
  );
}
