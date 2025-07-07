import { NextRequest, NextResponse } from "next/server";
import { serverSession } from "@/lib/auth";
import { PACKAGES, Package } from "@/lib/admin-data";

export async function GET() {
  const session = await serverSession();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  return NextResponse.json({ packages: PACKAGES });
}

export async function POST(req: NextRequest) {
  const session = await serverSession();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();

  if (Array.isArray(body.packages)) {
    PACKAGES.splice(0, PACKAGES.length, ...body.packages);
    return NextResponse.json({ ok: true });
  }

  const pkg = body as Package;
  const idx = PACKAGES.findIndex((p) => p.id === pkg.id);
  if (idx === -1) {
    PACKAGES.push(pkg);
  } else {
    PACKAGES[idx] = pkg;
  }

  return NextResponse.json({ ok: true });
}
