import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { serverSession } from "@/lib/auth";
import { TENANT_STATUS } from "@/lib/admin-data";

export async function GET(req: NextRequest) {
  const session = await serverSession();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const plan = url.searchParams.get("plan") || "";
  const status = url.searchParams.get("status") || "";

  const where: any = {};
  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
    ];
  }
  if (plan) {
    where.stripeCustomer = { plan };
  }

  const tenants = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      stripeCustomer: true,
    },
  });

  const result = tenants
    .map((t) => ({
      ...t,
      status: TENANT_STATUS[t.id] === false ? "inactive" : "active",
    }))
    .filter((t) => !status || t.status === status);

  return NextResponse.json({ tenants: result });
}

export async function POST(req: NextRequest) {
  const session = await serverSession();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const body = await req.json();
  const tenant = await prisma.user.create({
    data: {
      email: body.email,
      name: body.name,
      stripeCustomer: body.plan
        ? {
            create: {
              plan: body.plan,
              stripeId: "manual",
              currentPeriodEnd: new Date(),
            },
          }
        : undefined,
    },
  });
  return NextResponse.json({ tenant });
}
