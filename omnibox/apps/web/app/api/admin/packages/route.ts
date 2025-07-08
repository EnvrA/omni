import { NextRequest, NextResponse } from "next/server";
import { serverSession } from "@/lib/auth";
import { Package } from "@/lib/admin-data";
import { readPackages, writePackages } from "@/lib/package-store";

export async function GET() {
  const session = await serverSession();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const packages = await readPackages();
  return NextResponse.json({ packages });
}

export async function POST(req: NextRequest) {
  const session = await serverSession();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  let packages = await readPackages();

  if (Array.isArray(body.packages)) {
    packages = body.packages;
    await writePackages(packages);
    return NextResponse.json({ ok: true });
  }

  const pkg = body as Package;
  const idx = packages.findIndex((p) => p.id === pkg.id);
  if (idx === -1) {
    packages.push(pkg);
  } else {
    packages[idx] = pkg;
  }

  await writePackages(packages);
  return NextResponse.json({ ok: true });
}
