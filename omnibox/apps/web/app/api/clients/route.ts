import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { serverSession } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET() {
  const session = await serverSession();
  let email = session?.user?.email ?? "ee.altuntas@gmail.com";
  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true },
  });
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
      avatar: true,
      createdAt: true,
      messages: {
        orderBy: { sentAt: "desc" },
        take: 1,
        select: { sentAt: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const result = clients.map((c) => ({
    ...c,
    lastActivity: c.messages[0]?.sentAt ?? c.createdAt,
  }));

  return NextResponse.json({ clients: result });
}

export async function POST(req: NextRequest) {
  const session = await serverSession();
  let email = session?.user?.email ?? "ee.altuntas@gmail.com";
  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true },
  });
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    name,
    email: clientEmail,
    phone,
    company,
    notes,
    tag,
    avatar,
  } = body as {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    notes?: string;
    tag?: string;
    avatar?: string;
  };

  try {
    const client = await prisma.contact.create({
      data: {
        userId: user.id,
        name,
        email: clientEmail,
        phone,
        company,
        notes,
        tag,
        avatar,
      },
    });
    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Phone number already exists" },
        { status: 400 },
      );
    }
    throw error;
  }
}
