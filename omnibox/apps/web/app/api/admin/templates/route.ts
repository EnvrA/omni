import { NextRequest, NextResponse } from "next/server";
import { serverSession } from "@/lib/auth";
import { TEMPLATES } from "../features/route";

export async function POST(req: NextRequest) {
  const session = await serverSession();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const body = await req.json();
  TEMPLATES.push({ id: Math.random().toString(36).slice(2), text: body.text });
  return NextResponse.json({ ok: true });
}
