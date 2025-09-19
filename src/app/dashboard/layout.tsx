"use client";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen bg-slate-100 flex flex-col overflow-hidden">
      <Header />

      <div className="flex flex-1 mt-14 min-h-0 overflow-hidden">
        <Sidebar />

        <section className="flex-1 p-2 grid gap-2 overflow-auto">
          {children}
        </section>
      </div>
    </div>
  );
}
