"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const token = params.get("token");

  const valid = Boolean(token);

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw1.length < 6) return setMsg("Password must be at least 6 characters");
    if (pw1 !== pw2) return setMsg("Passwords do not match");
    setMsg("Password reset successful (UI only). Wire backend next.");
  }

  if (!token)
    return (
      <div className="p-6">
        Open with a token to preview the UI, e.g. /auth/resetPassword?token=test
      </div>
    );

  if (!valid)
    return <div className="p-6">This link is invalid or expired.</div>;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-white p-8 rounded-xl shadow space-y-4"
      >
        <h1 className="text-2xl font-semibold text-center">Set new password</h1>
        <label className="block text-sm">
          <span className="mb-1 block text-gray-700">New password</span>
          <input
            type="password"
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-gray-700">Confirm password</span>
          <input
            type="password"
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            required
          />
        </label>
        {msg && <p className="text-sm text-gray-700">{msg}</p>}
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center rounded-md bg-indigo-700 px-4 py-2 text-white hover:bg-indigo-600"
        >
          Reset password
        </button>
      </form>
    </div>
  );
}
