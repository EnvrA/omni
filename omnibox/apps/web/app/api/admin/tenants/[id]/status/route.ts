import { NextRequest, NextResponse } from "next/server";
import { serverSession } from "@/lib/auth";
import { TENANT_STATUS } from "@/lib/admin-data";

export async function POST(req: NextRequest, { params }: any) {
  const { id } = (await params) as { id: string };
  const session = await serverSession();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const { status } = await req.json();
  TENANT_STATUS[id] = status === "active";
  return NextResponse.json({ ok: true });
}
