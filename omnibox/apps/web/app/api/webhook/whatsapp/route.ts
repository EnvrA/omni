// apps/web/app/api/webhook/whatsapp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Provider } from "@prisma/client";
import {
  upsertContactAndMessage,
  type WhatsAppWebhook,
} from "@/lib/webhooks";

/* ------------------------------------------------------------------ */
/* 1️⃣  GET = Verification handshake (Meta calls this once)            */
/* ------------------------------------------------------------------ */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    // Echo the challenge so Meta knows we own the endpoint
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

/* ------------------------------------------------------------------ */
/* 2️⃣  POST = Real webhooks (messages & status updates)               */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  const payload = (await req.json()) as WhatsAppWebhook;

  // The sandbox payload structure
  const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const sentAt = new Date(Number(message.timestamp) * 1000);
  await upsertContactAndMessage(
    Provider.WHATSAPP,
    message.from,            // phone number in E.164
    message.text?.body || "",
    undefined,               // optional email (not applicable here)
    sentAt
  );

  return NextResponse.json({ ok: true });
}
