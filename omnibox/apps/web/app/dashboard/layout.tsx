"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  const base = "w-full rounded px-2 py-1 text-left hover:bg-gray-100";
  const classes = active ? `${base} bg-gray-200 shadow` : base;
  return (
    <Link href={href} className={classes} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-48 border-r p-4 space-y-2">
        <nav className="flex flex-col gap-2">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/dashboard/inbox">Inbox</NavLink>
          <NavLink href="/dashboard/deals">Deals</NavLink>
          <NavLink href="/dashboard/calendar">Calendar</NavLink>
          <NavLink href="/dashboard/clients">Clients</NavLink>
          <NavLink href="/dashboard/message-center">Message Center</NavLink>
          <NavLink href="/dashboard/segments">Segments</NavLink>
          <NavLink href="/dashboard/settings">Settings</NavLink>
        </nav>
      </aside>
      <main className="flex-1 p-4 overflow-y-auto">{children}</main>
    </div>
  );
}
