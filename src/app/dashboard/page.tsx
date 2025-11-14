"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchDashboard } from "@/store/slices/dashboardSlice";

import {
  IconUsers,
  IconBriefcase,
  IconBriefcaseOff,
  IconCash,
} from "@tabler/icons-react";

type KpiCardProps = {
  label: string;
  value: number;
  Icon: any;
  iconBg?: string;
  iconColor?: string;
};

function KpiCard({
  label,
  value,
  Icon,
  iconBg = "bg-slate-100",
  iconColor = "text-slate-600",
}: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-500">{label}</div>
        <div className="mt-2 text-2xl font-semibold">
          {value?.toLocaleString()}
        </div>
      </div>

      <div
        className={[
          "ml-4 size-14 rounded-full flex items-center justify-center",
          "shadow-md",
          "bg-[radial-gradient(closest-side,white,transparent_70%)]",
          iconBg,
        ].join(" ")}
      >
        <Icon className={iconColor} size={28} stroke={2} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const dispatch = useAppDispatch();

  const { stats, conversion, sales, team, loading, error } = useAppSelector(
    (s) => s.dashboard
  );

  const safeStats = stats || {
    totalLeads: 0,
    activeDeals: 0,
    closedDeals: 0,
    monthlyRevenue: 0,
  };

  const conversionUI = (conversion || []).map((c: any) => ({
    label: c.label || c.stage || "",
    percent: c.percent || 0,
  }));

  const salesUI = (sales || []).map((s: any) => ({
    m: s.m || s.month || "",
    base: s.base || s.won || 0,
    cap: s.cap || s.lost || 0,
  }));

  const teamUI = (team || []).map((t: any) => ({
    employee: t.employee || t.name || "",
    activeDeals: t.activeDeals || t.active || 0,
    closedDeals: t.closedDeals || t.closed || 0,
    revenue: t.revenue || "",
    change: t.change || "",
  }));

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="p-6 text-gray-600 animate-pulse">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-100 text-rose-700 rounded">
        Failed: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Leads"
          value={safeStats.totalLeads}
          Icon={IconUsers}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
        />
        <KpiCard
          label="Active Deals"
          value={safeStats.activeDeals}
          Icon={IconBriefcase}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <KpiCard
          label="Closed Deals"
          value={safeStats.closedDeals}
          Icon={IconBriefcaseOff}
          iconBg="bg-rose-100"
          iconColor="text-rose-600"
        />
        <KpiCard
          label="Monthly Revenue"
          value={safeStats.monthlyRevenue}
          Icon={IconCash}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow">
          <h3 className="font-medium mb-4">Contact to Deal Conversion</h3>

          <ul className="space-y-4">
            {conversionUI.map((item, idx) => {
              const colorMap: any = {
                Contact: "bg-violet-500",
                "Qualified Lead": "bg-emerald-500",
                "Proposal Sent": "bg-amber-400",
                Negotiation: "bg-violet-500",
                "Closed Won": "bg-emerald-600",
                "Closed Lost": "bg-rose-500",
              };

              const barColor = colorMap[item.label] || "bg-violet-500";

              return (
                <li key={idx}>
                  <div className="text-[13px] font-medium text-gray-700 mb-1">
                    {item.label}
                  </div>

                  <div className="h-1.5 w-full rounded bg-slate-200/70 relative overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 rounded ${barColor}`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="bg-white rounded-xl p-4 shadow lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Sales Reports</h3>
            <select className="border rounded px-2 py-1 text-sm">
              <option>Monthly</option>
              <option>Quarterly</option>
            </select>
          </div>

          <div className="grid grid-cols-[56px_repeat(12,1fr)] gap-3 h-64 items-end">
            <div className="flex flex-col justify-between h-full text-[11px] text-gray-500 pr-2">
              <span>$10000</span>
              <span>$5000</span>
              <span>$1000</span>
              <span>$500</span>
              <span>$200</span>
              <span>$0</span>
            </div>

            {salesUI.map((bar, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="relative flex flex-col items-center justify-end h-48">
                  <div
                    className="w-4 rounded-t bg-violet-300/35"
                    style={{ height: bar.cap }}
                  />
                  <div
                    className="w-4 rounded-t bg-violet-600 -mt-0.5"
                    style={{ height: bar.base }}
                  />
                </div>
                <span className="text-[11px] text-gray-500 mt-2">{bar.m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Team Performance Tracking</h3>

          <button className="border border-blue-600 text-blue-600 bg-transparent rounded px-3 py-1 text-sm hover:bg-blue-50">
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 text-m font-semibold text-gray-700 bg-gray-100 rounded-lg px-4 py-2">
          <div>Employee</div>
          <div className="text-center">Active Deals</div>
          <div className="text-center">Closed Deals</div>
          <div className="text-right">Revenue</div>
        </div>

        <ul className="mt-3 space-y-2">
          {teamUI.map((emp, idx) => (
            <li
              key={idx}
              className="grid grid-cols-4 gap-3 items-center rounded-lg border border-gray-200 bg-white px-4 py-2 hover:shadow-sm transition"
            >
              <div className="truncate">{emp.employee}</div>
              <div className="text-center">{emp.activeDeals}</div>
              <div className="text-center">{emp.closedDeals}</div>
              <div className="text-right">{emp.revenue}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
