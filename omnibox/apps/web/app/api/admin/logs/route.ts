import { NextRequest, NextResponse } from "next/server";
import { serverSession } from "@/lib/auth";

export let LOGS: {
  id: string;
  timestamp: string;
  message: string;
  resolved: boolean;
}[] = [];

export async function GET(req: NextRequest) {
  const session = await serverSession();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.toLowerCase() ?? "";
  const logs = LOGS.filter((l) => l.message.toLowerCase().includes(q));
  return NextResponse.json({ logs });
}

export async function POST(req: NextRequest) {
  const session = await serverSession();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const body = await req.json();
  LOGS.unshift({
    id: Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
    message: body.message,
    resolved: false,
  });
  return NextResponse.json({ ok: true });
}
