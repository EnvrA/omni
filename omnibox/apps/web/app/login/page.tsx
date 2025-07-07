import { serverSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components";

export default async function LoginPage() {
  const session = await serverSession();
  if (session) {
    const email = session.user?.email ?? "";
    if (email === process.env.ADMIN_EMAIL) {
      redirect("/admin/dashboard");
    } else {
      redirect("/dashboard");
    }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <LoginForm />
    </div>
  );
}
