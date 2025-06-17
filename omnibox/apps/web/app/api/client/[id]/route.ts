import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { serverSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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

  const client = await prisma.contact.update({
    where: { id: params.id, userId: user.id },
    data: { name, email: clientEmail, phone, company, notes, tag },
  });

  return NextResponse.json({ client });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await serverSession();
  let email = session?.user?.email ?? "ee.altuntas@gmail.com";
  const user = await prisma.user.findFirst({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.contact.delete({ where: { id: params.id, userId: user.id } });

  return NextResponse.json({});
}
