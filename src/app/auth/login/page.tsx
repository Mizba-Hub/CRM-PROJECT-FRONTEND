"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginSuccess, loginFailure } from "@/store/slices/authSlice";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { error } = useAppSelector((s) => s.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [fpOpen, setFpOpen] = useState(false);
  const [fpEmail, setFpEmail] = useState("");
  const [fpMsg, setFpMsg] = useState<string | null>(null);
  const [fpLoading, setFpLoading] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      dispatch(loginFailure("Email and password are required"));
      return;
    }
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const user = users.find(
      (u: any) => u.email === email && u.password === password
    );
    if (!user) {
      dispatch(loginFailure("Invalid email or password"));
      return;
    }
    dispatch(loginSuccess({ email: user.email }));
    localStorage.setItem("auth_token", user.email);
    setSuccess("Logged in successfully");
    setTimeout(() => router.replace("/dashboard"), 500);
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFpMsg(null);
    setFpLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to send email");
      setFpMsg("If the email exists, a reset link has been sent.");
    } catch (err: any) {
      setFpMsg(err.message || "Something went wrong");
    } finally {
      setFpLoading(false);
    }
  }

  function toggleShowPwd(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    e.preventDefault();
    setShowPwd((v) => !v);
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
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <div className="text-sm">
          <div className="flex items-center justify-between mb-1">
            <label className="text-gray-700">Password</label>

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
              className="w-full rounded-md border px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-violet-500"
              type={showPwd ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onClick={toggleShowPwd}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label={showPwd ? "Hide password" : "Show password"}
            >
              {showPwd ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {success && <p className="text-sm text-emerald-700">{success}</p>}

        <button
          type="submit"
          className="w-full inline-flex items-center justify-center rounded-md bg-indigo-700 px-4 py-2 text-white hover:bg-indigo-600"
        >
          Log in
        </button>

        <p className="text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <a href="/auth/register" className="text-violet-600">
            Sign up
          </a>
        </p>
      </form>

      {fpOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Reset password</h2>
              <button
                onClick={() => setFpOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                type="button"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Enter your account email to receive a password reset link.
            </p>
            <form onSubmit={handleForgotSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={fpEmail}
                onChange={(e) => setFpEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
              />
              {fpMsg && <p className="text-sm text-gray-700">{fpMsg}</p>}
              <div className="flex gap-2">
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
                  {fpLoading ? "Sending..." : "Send link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
