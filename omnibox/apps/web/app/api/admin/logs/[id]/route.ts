import { NextRequest, NextResponse } from "next/server";
import { serverSession } from "@/lib/auth";
import { LOGS } from "@/lib/admin-data";

export async function POST(
  req: NextRequest,
  { params }: any,
) {
  const { id } = (await params) as { id: string };
  const session = await serverSession();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const log = LOGS.find((l) => l.id === id);
  if (log) log.resolved = !log.resolved;
  return NextResponse.json({ ok: true });
}
