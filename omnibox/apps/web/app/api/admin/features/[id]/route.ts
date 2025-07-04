import { NextRequest, NextResponse } from "next/server";
import { serverSession } from "@/lib/auth";
import { FLAGS } from "@/lib/admin-data";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const session = await serverSession();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const flag = FLAGS.find((f) => f.id === id);
  if (flag) flag.enabled = !flag.enabled;
  return NextResponse.json({ ok: true });
}
