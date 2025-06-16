import { ReactNode } from "react";
import Link from "next/link";
import { Button } from "shadcn-ui-react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-48 border-r p-4 space-y-2">
        <nav className="flex flex-col gap-2">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/dashboard/inbox">Inbox</Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/dashboard/deals">Deals</Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/dashboard/settings">Settings</Link>
          </Button>
        </nav>
      </aside>
      <main className="flex-1 p-4 overflow-y-auto">{children}</main>
    </div>
  );
}
