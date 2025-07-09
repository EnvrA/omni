import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import sgMail from "@sendgrid/mail";
import crypto from "node:crypto";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
const EMAIL_FROM = process.env.EMAIL_FROM!;

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ ok: true });
  }
  const newPassword = crypto.randomBytes(8).toString("hex");
  const hashedPassword = await hash(newPassword, 10);
  await prisma.user.update({ where: { email }, data: { hashedPassword } });
  await sgMail.send({
    to: email,
    from: EMAIL_FROM,
    subject: "Your new password",
    text: `Your new password is: ${newPassword}`,
  });
  return NextResponse.json({ ok: true });
}
