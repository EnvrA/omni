import { NextResponse, NextRequest } from "next/server";
import { serverSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await serverSession();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const url = new URL(req.url);
  const range = parseInt(url.searchParams.get("range") || "30", 10);

  const metrics = [] as any[];
  const end = new Date();
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    metrics.push({
      date: d.toISOString().slice(0, 10),
      messages: Math.floor(Math.random() * 10),
      response: Math.floor(Math.random() * 1000),
      deals: Math.floor(Math.random() * 3),
    });
  }

  return NextResponse.json({ metrics });
}
