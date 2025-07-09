import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import sgMail from "@sendgrid/mail";
import crypto from "node:crypto";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
const EMAIL_FROM = process.env.EMAIL_FROM!;
const BASE_URL = process.env.NEXTAUTH_URL!;

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 400 });
  }
  const hashedPassword = await hash(password, 10);
  await prisma.user.create({ data: { email, name, hashedPassword } });

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  const verifyUrl = `${BASE_URL}/api/verify-email/${token}`;
  await sgMail.send({
    to: email,
    from: EMAIL_FROM,
    subject: "Confirm your email",
    html: `Click <a href="${verifyUrl}">here</a> to verify your address.`,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
