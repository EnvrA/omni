import { ReactNode } from "react";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-48 border-r p-4 space-y-2">
        <nav className="flex flex-col gap-2">
          <Link href="/dashboard/inbox" className="w-full rounded px-2 py-1 text-left hover:bg-gray-100">
            Inbox
          </Link>
          <Link href="/dashboard/deals" className="w-full rounded px-2 py-1 text-left hover:bg-gray-100">
            Deals
          </Link>
          <Link href="/dashboard/calendar" className="w-full rounded px-2 py-1 text-left hover:bg-gray-100">
            Calendar
          </Link>
          <Link href="/dashboard/clients" className="w-full rounded px-2 py-1 text-left hover:bg-gray-100">
            Clients
          </Link>
          <Link href="/dashboard/message-center" className="w-full rounded px-2 py-1 text-left hover:bg-gray-100">
            Message Center
          </Link>
          <Link href="/dashboard/segments" className="w-full rounded px-2 py-1 text-left hover:bg-gray-100">
            Segments
          </Link>
          <Link href="/dashboard/settings" className="w-full rounded px-2 py-1 text-left hover:bg-gray-100">
            Settings
          </Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto px-6 py-4 space-y-6">{children}</main>
    </div>
  );
}
