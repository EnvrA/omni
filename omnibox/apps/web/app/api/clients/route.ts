import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { serverSession } from "@/lib/auth";

export async function GET() {
  const session = await serverSession();
  let email = session?.user?.email ?? "ee.altuntas@gmail.com";
  const user = await prisma.user.findFirst({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ clients: [] });

  const clients = await prisma.contact.findMany({
    where: { userId: user.id },
    select: { id: true, name: true, email: true, phone: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ clients });
}

export async function POST(req: NextRequest) {
  const session = await serverSession();
  let email = session?.user?.email ?? "ee.altuntas@gmail.com";
  const user = await prisma.user.findFirst({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, email: clientEmail, phone } = body as { name?: string; email?: string; phone?: string };

  const client = await prisma.contact.create({
    data: { userId: user.id, name, email: clientEmail, phone },
  });

  return NextResponse.json({ client }, { status: 201 });
}
