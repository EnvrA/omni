import { NextResponse } from "next/server";
import { Provider } from "@prisma/client";
import { upsertContactAndMessage, type EmailWebhook } from "../../../../lib/webhooks";

export async function POST(req: Request) {
  const form = await req.formData();
  const payload: EmailWebhook = {
    from: (form.get("from") as string) || "",
    subject: (form.get("subject") as string) || "",
    text: (form.get("text") as string) || "",
  };
  if (!payload.from) {
    return new NextResponse("Bad Request", { status: 400 });
  }
  await upsertContactAndMessage(Provider.EMAIL, payload.from, payload.text, payload.from);
  return NextResponse.json({ ok: true });
}
