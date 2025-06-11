import { NextResponse } from "next/server";
import { Provider } from "@prisma/client";
import { upsertContactAndMessage, type SmsWebhook } from "../../../../lib/webhooks";

export async function POST(req: Request) {
  const text = await req.text();
  const params = new URLSearchParams(text);
  const payload: SmsWebhook = {
    From: params.get("From") || "",
    Body: params.get("Body") || "",
  };
  if (!payload.From) {
    return new NextResponse("Bad Request", { status: 400 });
  }
  await upsertContactAndMessage(Provider.SMS, payload.From, payload.Body);
  return NextResponse.json({ ok: true });
}
