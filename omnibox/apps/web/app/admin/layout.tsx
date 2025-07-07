import { ReactNode } from "react";
import Link from "next/link";
import { serverSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await serverSession();
  if (!session) redirect("/signin");
  if (session.user?.email !== process.env.ADMIN_EMAIL) redirect("/");

  return (
    <div className="flex min-h-screen">
      <aside className="w-48 border-r p-4 flex flex-col">
        <nav className="flex flex-col gap-2 flex-1">
          <Link
            href="/admin/dashboard"
            className="w-full rounded px-2 py-1 text-left hover:bg-gray-100"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/tenants"
            className="w-full rounded px-2 py-1 text-left hover:bg-gray-100"
          >
            Tenants
          </Link>
          <Link
            href="/admin/usage"
            className="w-full rounded px-2 py-1 text-left hover:bg-gray-100"
          >
            Usage Metrics
          </Link>
          <Link
            href="/admin/logs"
            className="w-full rounded px-2 py-1 text-left hover:bg-gray-100"
          >
            Logs & Alerts
          </Link>
          <Link
            href="/admin/features"
            className="w-full rounded px-2 py-1 text-left hover:bg-gray-100"
          >
            Features
          </Link>
          <Link
            href="/admin/packages"
            className="w-full rounded px-2 py-1 text-left hover:bg-gray-100"
          >
            Packages
          </Link>
        </nav>
        <LogoutButton />
      </aside>
      <main className="flex-1 p-4 overflow-y-auto">{children}</main>
    </div>
  );
}
