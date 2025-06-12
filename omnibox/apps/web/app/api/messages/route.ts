import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "../../../lib/prisma";
import { serverSession } from "../../../lib/auth";

const querySchema = z.object({
  contactId: z.string().uuid(),
});

export async function GET(req: NextRequest) {
  // Get the session and log it
  let session = await serverSession();
  console.log("SESSION OBJECT IN /api/messages:", session);

  // If no session or no email, reject
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Look up userId by email (since session.user.id is missing)
  const userRecord = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!userRecord) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = userRecord.id;

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
