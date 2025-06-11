import { NextResponse } from "next/server";
import { Provider } from "@prisma/client";
import { upsertContactAndMessage, type WhatsAppWebhook } from "../../../../lib/webhooks";

export async function POST(req: Request) {
  const payload = (await req.json()) as WhatsAppWebhook;
  const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message) {
    return new NextResponse("Bad Request", { status: 400 });
  }
  const sentAt = new Date(Number(message.timestamp) * 1000);
  await upsertContactAndMessage(
    Provider.WHATSAPP,
    message.from,
    message.text?.body || "",
    undefined,
    sentAt
  );
  return NextResponse.json({ ok: true });
}
