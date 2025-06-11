// apps/web/app/api/webhook/sms/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Provider } from "@prisma/client";

// 👉 use this import if the @/* alias is set in apps/web/tsconfig.json
import {
  upsertContactAndMessage,
  type SmsWebhook,
} from "@/lib/webhooks";

/*  If the alias isn’t set, comment the line above and uncomment this one:
import {
  upsertContactAndMessage,
  type SmsWebhook,
} from "../../../../lib/webhooks";
*/

export async function POST(req: NextRequest) {
  // Twilio sends x-www-form-urlencoded
  const bodyText = await req.text();
  const params = new URLSearchParams(bodyText);

  const payload: SmsWebhook = {
    From: params.get("From") ?? "",
    Body: params.get("Body") ?? "",
  };

  if (!payload.From) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  await upsertContactAndMessage(
    Provider.SMS,
    payload.From,          // phone number
    payload.Body           // SMS text
  );

  return NextResponse.json({ ok: true });
}
