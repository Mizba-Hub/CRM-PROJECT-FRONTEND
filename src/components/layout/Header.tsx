"use client";

import { useEffect, useState } from "react";
import { MagnifyingGlassIcon, BellIcon } from "@heroicons/react/24/outline";

export default function Header() {
  const [initial, setInitial] = useState<string>("");

  useEffect(() => {
    try {
      const emailOrName = localStorage.getItem("auth_token") || "";
      const first = emailOrName.trim().charAt(0);
      setInitial(first ? first.toUpperCase() : "");
    } catch {
      setInitial("");
    }
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white px-6 py-3">
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

          <div
            className="h-8 w-8 rounded-full bg-indigo-700 text-white grid place-items-center text-sm font-semibold"
            aria-label="Account"
          >
            {initial}
          </div>
        </div>
      </div>
    </header>
  );
}
