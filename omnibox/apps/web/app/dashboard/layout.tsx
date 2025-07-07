import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { serverSession } from "@/lib/auth";
import Sidebar from "./sidebar";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await serverSession();
  if (!session) redirect("/login");
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 overflow-y-auto">{children}</main>
    </div>
  );
}
