import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "../../../lib/prisma";
import { serverSession } from "../../../lib/auth";

// Validation for GET query param
const querySchema = z.object({
  contactId: z.string().uuid(),
});

export async function GET(req: NextRequest) {
  let session = await serverSession();
  console.log("SESSION OBJECT IN /api/messages:", session);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Look up userId by email
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

// ---------- POST: Create/Send a new message ----------
export async function POST(req: NextRequest) {
  let session = await serverSession();

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bodyJson = await req.json();
  const { contactId, body, provider = "SMS", direction = "OUT" } = bodyJson;

  if (!contactId || !body) {
    return NextResponse.json({ error: "Missing contactId or body" }, { status: 400 });
  }

  // (Optional) Validate that the contact belongs to the user
  const userRecord = await prisma.user.findUnique({
    where: { email: session.user.email }
  });
  if (!userRecord) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = userRecord.id;

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, userId },
    select: { id: true },
  });
  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const message = await prisma.message.create({
    data: {
      contactId,
      userId,
      body,
      provider,
      direction,
      sentAt: new Date(),
    },
  });

  return NextResponse.json(message);
}
