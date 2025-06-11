import { NextResponse } from "next/server";
import { serverSession } from "../../../lib/auth";

export async function GET() {
  const session = await serverSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  return NextResponse.json({ user: session.user });
}
