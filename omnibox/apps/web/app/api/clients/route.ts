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
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      company: true,
      notes: true,
      tag: true,
      createdAt: true,
      messages: { orderBy: { sentAt: "desc" }, take: 1, select: { sentAt: true } },
    },
    orderBy: { name: "asc" },
  });

  const result = clients.map(c => ({
    ...c,
    lastActivity: c.messages[0]?.sentAt ?? c.createdAt,
  }));

  return NextResponse.json({ clients: result });
}

export async function POST(req: NextRequest) {
  const session = await serverSession();
  let email = session?.user?.email ?? "ee.altuntas@gmail.com";
  const user = await prisma.user.findFirst({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, email: clientEmail, phone, company, notes, tag } = body as {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    notes?: string;
    tag?: string;
  };

  const client = await prisma.contact.create({
    data: { userId: user.id, name, email: clientEmail, phone, company, notes, tag },
  });

  return NextResponse.json({ client }, { status: 201 });
}
