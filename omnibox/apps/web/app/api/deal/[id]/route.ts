import { NextRequest, NextResponse } from "next/server";
type RouteContext = { params: { id: string } };
import prisma from "@/lib/prisma";
import { serverSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext,
) {
  const { id } = (await params) as { id: string };
  const session = await serverSession();
  let email = session?.user?.email ?? "ee.altuntas@gmail.com";
  const user = await prisma.user.findFirst({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { stage } = await req.json();

  const deal = await prisma.deal.update({
    where: { id, userId: user.id },
    data: { stage },
  });

  return NextResponse.json({ deal });
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext,
) {
  const { id } = (await params) as { id: string };
  const session = await serverSession();
  let email = session?.user?.email ?? "ee.altuntas@gmail.com";
  const user = await prisma.user.findFirst({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.deal.delete({ where: { id, userId: user.id } });

  return NextResponse.json({});
}
