"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Squares2X2Icon,
  UserGroupIcon,
  BuildingOffice2Icon,
  BriefcaseIcon,
  TicketIcon,
} from "@heroicons/react/24/outline";

const nav = [
  { href: "/dashboard", label: "Dashboard", Icon: Squares2X2Icon },
  { href: "/dashboard/modules/leads", label: "Leads", Icon: UserGroupIcon },
  {
    href: "/dashboard/modules/companies",
    label: "Companies",
    Icon: BuildingOffice2Icon,
  },
  { href: "/dashboard/modules/deals", label: "Deals", Icon: BriefcaseIcon },
  { href: "/dashboard/modules/tickets", label: "Tickets", Icon: TicketIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-20 flex-col items-center py-4 bg-white">
      <nav className="mt-2 flex-1 flex flex-col items-center">
        {nav.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="w-full px-2 py-3 flex flex-col items-center"
              aria-label={label}
            >
              <div
                className={[
                  "h-10 w-10 grid place-items-center rounded-xl transition",
                  active
                    ? "bg-indigo-700 text-white ring-2 ring-indigo-600"
                    : "text-gray-600 hover:bg-slate-100",
                ].join(" ")}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={[
                  "mt-1 text-[11px] leading-4 text-center",
                  active ? "text-indigo-700 font-medium" : "text-gray-600",
                ].join(" ")}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
