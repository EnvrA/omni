import type { NextApiRequest, NextApiResponse } from 'next';
import { Provider } from "@prisma/client";
import { upsertContactAndMessage } from "@/lib/webhooks";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Twilio sends x-www-form-urlencoded
  const params = req.body && typeof req.body === "object"
    ? req.body
    : Object.fromEntries(new URLSearchParams(req.body || ""));

  const payload = {
    From: params.From ?? "",
    Body: params.Body ?? "",
  };

  console.log("INBOUND SMS (pages/api):", payload);

  if (!payload.From) {
    return res.status(400).json({ error: "Bad Request" });
  }

  await upsertContactAndMessage(
    Provider.SMS,
    payload.From,          // phone number
    payload.Body           // SMS text
  );

  return res.status(200).json({ ok: true });
}
