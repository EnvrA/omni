"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Inbox,
  Handshake,
  Calendar,
  Users,
  FileText,
  MessageCircle,
  PieChart,
  Settings,
} from "lucide-react";

function NavLink({
  href,
  children,
  icon: Icon,
}: {
  href: string;
  children: React.ReactNode;
  icon: LucideIcon;
}) {
  const pathname = usePathname();
  const isActive =
    href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  const base =
    "flex items-center gap-2 w-full rounded px-2 py-1 text-left hover:bg-gray-100";
  const classes =
    base + (isActive ? " bg-gray-200 border-l-4 border-blue-600 font-medium" : "");
  return (
    <Link href={href} className={classes} aria-current={isActive ? "page" : undefined}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="truncate">{children}</span>
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-48 sm:w-60 border-r p-4 space-y-2">
        <nav className="flex flex-col gap-2">
          <NavLink href="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
          <NavLink href="/dashboard/inbox" icon={Inbox}>Inbox</NavLink>
          <NavLink href="/dashboard/deals" icon={Handshake}>Deals</NavLink>
          <NavLink href="/dashboard/calendar" icon={Calendar}>Calendar</NavLink>
          <NavLink href="/dashboard/clients" icon={Users}>Clients</NavLink>
          <NavLink href="/dashboard/invoices" icon={FileText}>Invoicing</NavLink>
          <NavLink href="/dashboard/message-center" icon={MessageCircle}>
            Message Center
          </NavLink>
          <NavLink href="/dashboard/segments" icon={PieChart}>Segments</NavLink>
          <NavLink href="/dashboard/settings" icon={Settings}>Settings</NavLink>
        </nav>
      </aside>
      <main className="flex-1 p-4 overflow-y-auto">{children}</main>
    </div>
  );
}
