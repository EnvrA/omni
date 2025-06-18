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
      contact: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ deals });
}

export async function POST(req: Request) {
  const session = await serverSession();
  let email = session?.user?.email ?? "ee.altuntas@gmail.com";

  const user = await prisma.user.findFirst({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const contactId = body.contactId as string | undefined;
  if (!contactId) return NextResponse.json({ error: "Missing contactId" }, { status: 400 });

  const deal = await prisma.deal.create({
    data: {
      userId: user.id,
      contactId,
      stage: "NEW",
    },
  });

  return NextResponse.json({ deal }, { status: 201 });
}
