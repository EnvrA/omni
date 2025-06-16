import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { serverSession } from "@/lib/auth";

export async function GET() {
  const session = await serverSession();
  let email = session?.user?.email ?? "ee.altuntas@gmail.com";

  const user = await prisma.user.findFirst({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ deals: [] });

  const deals = await prisma.deal.findMany({
    where: { userId: user.id },
    include: {
      contact: { select: { name: true } },
    },
  });

  return NextResponse.json({ deals });
}
