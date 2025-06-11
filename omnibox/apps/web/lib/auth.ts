/* eslint-disable turbo/no-undeclared-env-vars */
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import { Resend } from "resend";
import sgMail from "@sendgrid/mail";
import { getServerSession, type NextAuthOptions } from "next-auth";
import prisma from "./prisma";

const resend = new Resend(process.env.RESEND_API_KEY || "");
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

async function sendEmail({ identifier, url }: { identifier: string; url: string }) {
  const html = `<p>Sign in using the magic link below:</p><p><a href="${url}">${url}</a></p>`;
  const from = process.env.EMAIL_FROM as string;

  if (process.env.NODE_ENV === "production") {
    await sgMail.send({ to: identifier, from, subject: "Sign in to Omni", html });
  } else {
    await resend.emails.send({ to: identifier, from, subject: "Sign in to Omni", html });
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      async sendVerificationRequest(params) {
        await sendEmail(params);
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
};

export function serverSession() {
  return getServerSession(authOptions);
}
