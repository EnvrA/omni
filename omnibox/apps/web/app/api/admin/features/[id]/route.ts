import { NextResponse } from "next/server";
import { serverSession } from "@/lib/auth";
import { FLAGS } from "../route";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await serverSession();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const flag = FLAGS.find((f) => f.id === params.id);
  if (flag) flag.enabled = !flag.enabled;
  return NextResponse.json({ ok: true });
}
