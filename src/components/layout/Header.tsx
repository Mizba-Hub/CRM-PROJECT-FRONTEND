"use client";

import { useEffect, useRef, useState } from "react";
import { MagnifyingGlassIcon, BellIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

type User = { firstName?: string; lastName?: string; email?: string };

export default function Header() {
  const router = useRouter();
  const [initial, setInitial] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("auth_token") || "";
      const users: User[] = JSON.parse(localStorage.getItem("users") || "[]");
      const current = (users as any[]).find((u) => u.email === token) || null;
      setUser(current);

      const first = (current?.firstName || token || "").trim().charAt(0);
      setInitial(first ? first.toUpperCase() : "");
    } catch {
      setUser(null);
      setInitial("");
    }
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function handleLogout() {
    localStorage.removeItem("auth_token");
    setOpen(false);

    setTimeout(() => router.replace("/auth/login"), 500);
    router.replace("/auth/login");
  }

  const displayName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white px-6 py-3 border-b">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-gray-900">CRM</div>

        <div className="flex items-center gap-3">
          <label className="relative w-72">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="search"
              placeholder="Search"
              className="w-full rounded-md border border-slate-300 pl-8 pr-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-700"
            />
          </label>

          <button
            type="button"
            className="h-9 w-9 grid place-items-center rounded-full text-gray-600 hover:bg-slate-100"
            aria-label="Notifications"
          >
            <BellIcon className="h-5 w-5" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="h-8 w-8 rounded-full bg-indigo-700 text-white grid place-items-center text-sm font-semibold"
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label="Account"
            >
              {initial || "?"}
            </button>

            {open && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-72 rounded-lg border bg-white shadow-lg ring-1 ring-black/5 overflow-hidden"
              >
                <div className="px-4 py-3 border-b">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {displayName || "User"}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {user?.email || "no-email@example.com"}
                  </p>
                </div>

                <div className="border-t">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                  >
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
