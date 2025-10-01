"use client";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="h-screen w-screen bg-slate-100 flex flex-col overflow-hidden">
      <Header />

      <div className="flex flex-1 mt-14 min-h-0 overflow-hidden">
        <Sidebar />

        <main className="flex-1 p-4 grid gap-4 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
