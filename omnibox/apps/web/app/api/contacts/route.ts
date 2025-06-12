import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { serverSession } from "@/lib/auth";

export async function GET() {
  const session = await serverSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // find the logged-in user
  const user = await prisma.user.findFirst({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // latest message timestamp per contact
  const contacts = await prisma.contact.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
      messages: {
        orderBy: { sentAt: "desc" },
        take: 1,
        select: { sentAt: true },
      },
    },
  });

  const result = contacts.map(c => ({
    id: c.id,
    name: c.name,
    lastMessageAt: c.messages[0]?.sentAt ?? null,
  })).sort((a, b) =>
    (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0)
  );

  return NextResponse.json({ contacts: result });
}
