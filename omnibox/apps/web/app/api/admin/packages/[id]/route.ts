import { NextRequest, NextResponse } from "next/server";
import { serverSession } from "@/lib/auth";
import { readPackages, writePackages } from "@/lib/package-store";

export async function DELETE(_req: NextRequest, { params }: any) {
  const { id } = params as { id: string };
  const session = await serverSession();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const packages = await readPackages();
  const idx = packages.findIndex((p) => p.id === id);
  if (idx !== -1) {
    packages.splice(idx, 1);
    await writePackages(packages);
  }
  return NextResponse.json({ ok: true });
}
