"use client";

import { useEffect, useState } from "react";
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
          {value.toLocaleString()}
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

export default function DashboardContent() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    ActiveDeals: 0,
    ClosedDeals: 0,
    MonthlyRevenue: 0,
  });

  useEffect(() => {
    // mock fetch
    setStats({
      totalLeads: 1250,
      ActiveDeals: 320,
      ClosedDeals: 136,
      MonthlyRevenue: 45000,
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Leads"
          value={stats.totalLeads}
          Icon={IconUsers}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
        />
        <KpiCard
          label="Active Deals"
          value={stats.ActiveDeals}
          Icon={IconBriefcase}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <KpiCard
          label="Closed Deals"
          value={stats.ClosedDeals}
          Icon={IconBriefcaseOff}
          iconBg="bg-rose-100"
          iconColor="text-rose-600"
        />
        <KpiCard
          label="Monthly Revenue"
          value={stats.MonthlyRevenue}
          Icon={IconCash}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow">
          <div className="mb-4">
            <h3 className="font-medium">Contact to Deal Conversion</h3>
          </div>

          <ul className="space-y-4">
            <li>
              <div className="text-[13px] font-medium text-gray-700 mb-1">
                Contact
              </div>
              <div className="h-1.5 w-full rounded bg-slate-200/70 relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-violet-500 rounded"
                  style={{ width: "60%" }}
                />
              </div>
            </li>
            <li>
              <div className="text-[13px] font-medium text-gray-700 mb-1">
                Qualified Lead
              </div>
              <div className="h-1.5 w-full rounded bg-slate-200/70 relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-violet-400 rounded"
                  style={{ width: "40%" }}
                />
              </div>
            </li>
            <li>
              <div className="text-[13px] font-medium text-gray-700 mb-1">
                Proposal Sent
              </div>
              <div className="h-1.5 w-full rounded bg-slate-200/70 relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-amber-400 rounded"
                  style={{ width: "33%" }}
                />
              </div>
            </li>
            <li>
              <div className="text-[13px] font-medium text-gray-700 mb-1">
                Negotiation
              </div>
              <div className="h-1.5 w-full rounded bg-slate-200/70 relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-violet-300 rounded"
                  style={{ width: "40%" }}
                />
              </div>
            </li>
            <li>
              <div className="text-[13px] font-medium text-gray-700 mb-1">
                Closed Won
              </div>
              <div className="h-1.5 w-full rounded bg-slate-200/70 relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-emerald-500 rounded"
                  style={{ width: "25%" }}
                />
              </div>
            </li>
            <li>
              <div className="text-[13px] font-medium text-gray-700 mb-1">
                Closed Lost
              </div>
              <div className="h-1.5 w-full rounded bg-slate-200/70 relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-rose-500 rounded"
                  style={{ width: "16.6667%" }}
                />
              </div>
            </li>
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

            {[
              { m: "Jan", base: 60, cap: 36 },
              { m: "Feb", base: 70, cap: 70 },
              { m: "Mar", base: 44, cap: 20 },
              { m: "Apr", base: 64, cap: 36 },
              { m: "May", base: 76, cap: 52 },
              { m: "Jun", base: 40, cap: 24 },
              { m: "Jul", base: 48, cap: 28 },
              { m: "Aug", base: 72, cap: 56 },
              { m: "Sep", base: 88, cap: 12 },
              { m: "Oct", base: 68, cap: 20 },
              { m: "Nov", base: 62, cap: 24 },
              { m: "Dec", base: 70, cap: 24 },
            ].map(({ m, base, cap }) => (
              <div key={m} className="flex flex-col items-center">
                <div className="relative flex flex-col items-center justify-end h-48">
                  <div
                    className="w-4 rounded-t bg-violet-300/35"
                    style={{ height: cap }}
                  />

                  <div
                    className="w-4 rounded-t bg-violet-600 -mt-0.5"
                    style={{ height: base }}
                  />
                </div>
                <span className="text-[11px] text-gray-500 mt-2">{m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Team Performance Tracking</h3>
          <button
            className="border border-blue-600 text-blue-600 bg-transparent
             rounded px-3 py-1 text-sm
             hover:bg-blue-50
             focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
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
          {[
            {
              name: "Ethan Harper",
              active: 25,
              closed: 10,
              revenue: "$12,000",
              change: "+3.4%",
            },
            {
              name: "Olivia Bennett",
              active: 30,
              closed: 15,
              revenue: "$15,000",
              change: "-0.1%",
            },
            {
              name: "Liam Carter",
              active: 22,
              closed: 12,
              revenue: "$10,000",
              change: "+3.4%",
            },
            {
              name: "Sophia Evans",
              active: 28,
              closed: 14,
              revenue: "$14,000",
              change: "-0.1%",
            },
          ].map((r) => (
            <li
              key={r.name}
              className="grid grid-cols-4 gap-3 items-center rounded-lg border border-gray-200 bg-white px-4 py-2 hover:shadow-sm transition"
            >
              <div className="truncate">{r.name}</div>
              <div className="text-center">{r.active}</div>
              <div className="text-center">{r.closed}</div>
              <div className="text-right">
                <span className="mr-2">{r.revenue}</span>
                <span
                  className={[
                    "inline-block rounded px-2 py-0.5 text-[11px]",
                    r.change.startsWith("+")
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700",
                  ].join(" ")}
                >
                  {r.change}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
