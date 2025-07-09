import { serverSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components";

export default async function ForgotPasswordPage() {
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
      <ForgotPasswordForm />
    </div>
  );
}
