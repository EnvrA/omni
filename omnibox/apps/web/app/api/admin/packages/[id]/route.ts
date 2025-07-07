import { NextRequest, NextResponse } from "next/server";
import { serverSession } from "@/lib/auth";
import { PACKAGES } from "@/lib/admin-data";

export async function DELETE(_req: NextRequest, { params }: any) {
  const { id } = params as { id: string };
  const session = await serverSession();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const idx = PACKAGES.findIndex((p) => p.id === id);
  if (idx !== -1) PACKAGES.splice(idx, 1);
  return NextResponse.json({ ok: true });
}
