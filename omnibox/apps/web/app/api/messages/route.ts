import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "../../../lib/prisma";
import { serverSession } from "../../../lib/auth";

const querySchema = z.object({
  contactId: z.string().uuid(),
});

export async function GET(req: NextRequest) {
  const session = await serverSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const contactId = url.searchParams.get("contactId");

  const result = querySchema.safeParse({ contactId });
  if (!result.success) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const contact = await prisma.contact.findFirst({
    where: { id: result.data.contactId, userId },
    select: { id: true },
  });

  if (!contact) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

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
