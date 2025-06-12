import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { serverSession } from "../../../lib/auth";

export async function GET() {
  const session = await serverSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const userId = (session.user as { id?: string })?.id;
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const contacts = await prisma.contact.findMany({
    where: { userId },
    include: {
      messages: {
        select: { sentAt: true },
        orderBy: { sentAt: "desc" },
        take: 1,
      },
    },
  });

  contacts.sort((a, b) => {
    const aDate = a.messages[0]?.sentAt ?? new Date(0);
    const bDate = b.messages[0]?.sentAt ?? new Date(0);
    return bDate.getTime() - aDate.getTime();
  });

  const result = contacts.map((c) => ({
    id: c.id,
    name: c.name,
    lastMessageAt: c.messages[0]?.sentAt ?? null,
  }));

  return NextResponse.json(result);
}
