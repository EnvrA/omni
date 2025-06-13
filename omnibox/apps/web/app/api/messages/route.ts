import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { serverSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await serverSession();

  // DEV FALLBACK
  let email = session?.user?.email ?? "ee.altuntas@gmail.com";

  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ messages: [] });

  const url = new URL(req.url);
  const contactId = url.searchParams.get("contactId");
  if (!contactId) return NextResponse.json({ messages: [] });

  // Only fetch messages for contacts that belong to the user
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
