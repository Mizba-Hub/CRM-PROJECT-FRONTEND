"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginUser } from "@/store/slices/authSlice";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { error, loading } = useAppSelector((s) => s.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const [fpOpen, setFpOpen] = useState(false);
  const [fpEmail, setFpEmail] = useState("");
  const [fpMsg, setFpMsg] = useState<string | null>(null);
  const [fpLoading, setFpLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await dispatch(loginUser({ email, password }));

    if (loginUser.fulfilled.match(result)) {
      const { token, user } = result.payload;

      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_user", JSON.stringify(user));

      setTimeout(() => {
        router.push("/dashboard");
      }, 50);
    }
  };

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFpMsg(null);
    setFpLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: fpEmail }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setFpMsg("Reset link sent! Check your email.");
    } catch (err: any) {
      setFpMsg(err.message);
    }

    setFpLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-white p-8 rounded-xl shadow space-y-4"
      >
        <h1 className="text-2xl font-semibold text-center">Log in</h1>

        <label className="block text-sm">
          <span className="mb-1 block text-gray-700">Email</span>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="block text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-gray-700">Password</span>

            <button
              type="button"
              onClick={() => setFpOpen(true)}
              className="text-sm text-violet-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <div className="relative">
            <input
              className="w-full rounded-md border px-3 py-2 pr-12 outline-none focus:ring-2 focus:ring-violet-500"
              type={showPwd ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowPwd((v) => !v);
              }}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-600 hover:text-gray-800"
            >
              {showPwd ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </label>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-indigo-700 text-white py-2"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>

        <p className="text-center text-sm">
          Don't have an account?{" "}
          <a href="/auth/register" className="text-violet-600">
            Sign up
          </a>
        </p>
      </form>

      {fpOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-gray-200 relative">
            <button
              type="button"
              onClick={() => setFpOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>

            <h2 className="text-lg font-semibold mb-2">Reset Password</h2>
            <p className="text-sm text-gray-600 mb-4">
              Enter your email to receive a password reset link.
            </p>

            <form onSubmit={handleForgotSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="you@example.com"
                value={fpEmail}
                onChange={(e) => setFpEmail(e.target.value)}
                className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
                required
              />

              {fpMsg && <p className="text-sm text-gray-700">{fpMsg}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFpOpen(false)}
                  className="flex-1 rounded-md border px-3 py-2"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={fpLoading}
                  className="flex-1 rounded-md bg-indigo-700 text-white px-3 py-2 hover:bg-indigo-600 disabled:opacity-60"
                >
                  {fpLoading ? "Sending..." : "Send Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
