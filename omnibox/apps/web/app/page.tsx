import { serverSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await serverSession();
  if (session) {
    const email = session.user?.email ?? "";
    if (email === process.env.ADMIN_EMAIL) {
      redirect("/admin/dashboard");
    } else {
      redirect("/dashboard");
    }
  }
  redirect("/register");
}
