import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { serverSession } from "@/lib/auth";

export async function GET() {
  const session = await serverSession();
  let email = session?.user?.email ?? "ee.altuntas@gmail.com";
  const user = await prisma.user.findFirst({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ status: "unknown" });
  const customer = await prisma.stripeCustomer.findFirst({ where: { userId: user.id } });
  return NextResponse.json({ plan: customer?.plan ?? "starter" });
}
