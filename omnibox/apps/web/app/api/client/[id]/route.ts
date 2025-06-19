import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { serverSession } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
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

  const { id } = await params;
  try {
    const client = await prisma.contact.update({
      where: { id, userId: user.id },
      data: { name, email: clientEmail, phone, company, notes, tag, avatar },
    });

    return NextResponse.json({ client });
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await serverSession();
  let email = session?.user?.email ?? "ee.altuntas@gmail.com";
  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true },
  });
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.deal.deleteMany({ where: { contactId: id, userId: user.id } });
  await prisma.contact.delete({ where: { id, userId: user.id } });

  return NextResponse.json({});
}
