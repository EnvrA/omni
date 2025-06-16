import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { serverSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await serverSession();
  let email = session?.user?.email ?? "ee.altuntas@gmail.com";
  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ messages: [] });

  const url = new URL(req.url);
  const contactId = url.searchParams.get("contactId");
  if (!contactId) return NextResponse.json({ messages: [] });

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, userId: user.id },
    select: { id: true },
  });
  if (!contact) return NextResponse.json({ messages: [] });

  const messages = await prisma.message.findMany({
    where: { contactId: contact.id },
    orderBy: { sentAt: "desc" },
    take: 50,
    select: {
      id: true,
      provider: true,
      body: true,
      direction: true,
      sentAt: true,
    },
  });

  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  try {
    const session = await serverSession();
    let email = session?.user?.email ?? "ee.altuntas@gmail.com";
    const user = await prisma.user.findFirst({
      where: { email },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });

    const body = await req.json();
    const { contactId, body: messageBody } = body;

    const contact = await prisma.contact.findFirst({
      where: { id: contactId, userId: user.id },
      select: { id: true },
    });
    if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    const saved = await prisma.message.create({
      data: {
        contactId,
        userId: user.id,
        body: messageBody,
        provider: "SMS",
        direction: "OUT",
        sentAt: new Date(),
      },
    });

    return NextResponse.json({ message: saved }, { status: 201 });
  } catch (error) {
    console.error("POST /api/messages error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
