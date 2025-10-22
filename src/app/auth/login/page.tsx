"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginSuccess, loginFailure } from "@/store/slices/authSlice";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

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

    setTimeout(() => {
      router.replace("/dashboard");
    }, 800);
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

        <label className="block text-sm">
          <span className="mb-1 block text-gray-700">Password</span>
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
              onClick={() => setShowPwd((v) => !v)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
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
    </div>
  );
}
