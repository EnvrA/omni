import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { serverSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await serverSession();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const body = await req.json();
  const { plan } = body;
  await prisma.stripeCustomer.upsert({
    where: { userId: params.id },
    update: { plan },
    create: {
      userId: params.id,
      plan,
      stripeId: "manual",
      currentPeriodEnd: new Date(),
    },
  });
  return NextResponse.json({ ok: true });
}
