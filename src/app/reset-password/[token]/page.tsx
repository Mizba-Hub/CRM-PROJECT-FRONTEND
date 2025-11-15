"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordPage() {
  const { token } = useParams();

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (pw1 !== pw2) return setMsg("Passwords do not match");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            password: pw1,
            confirmPassword: pw2,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setMsg("Password reset successful! Redirecting...");
      setTimeout(() => (window.location.href = "/auth/login"), 2000);
    } catch (err: any) {
      setMsg(err.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-white p-8 rounded-xl shadow space-y-4"
      >
        <h1 className="text-2xl font-semibold text-center">Set new password</h1>

        <input
          type="password"
          placeholder="New password"
          value={pw1}
          onChange={(e) => setPw1(e.target.value)}
          className="w-full border p-2 rounded-md"
          required
        />

        <input
          type="password"
          placeholder="Confirm password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          className="w-full border p-2 rounded-md"
          required
        />

        {msg && <p className="text-sm text-gray-700">{msg}</p>}

        <button className="w-full bg-indigo-700 text-white p-2 rounded-md">
          Reset Password
        </button>
      </form>
    </div>
  );
}
