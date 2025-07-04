import { NextRequest, NextResponse } from "next/server";
import { serverSession } from "@/lib/auth";
import { FLAGS, TEMPLATES } from "@/lib/admin-data";

export async function GET() {
  const session = await serverSession();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  return NextResponse.json({ flags: FLAGS, templates: TEMPLATES });
}

export async function POST(req: NextRequest) {
  const session = await serverSession();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const body = await req.json();
  const flag = FLAGS.find((f) => f.id === body.id);
  if (flag) flag.enabled = !flag.enabled;
  return NextResponse.json({ ok: true });
}

