/* eslint-disable turbo/no-undeclared-env-vars */
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import sgMail from "@sendgrid/mail";
import { getServerSession, type NextAuthOptions } from "next-auth";
import prisma from "./prisma";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
const EMAIL_FROM = process.env.EMAIL_FROM!;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      maxAge: 15 * 60, // 15-minute link
      async sendVerificationRequest({ identifier, url }) {
        await sgMail.send({
          to: identifier,
          from: EMAIL_FROM,
          subject: "Log in to OmniInbox",
          html: `
            <p>Hi there!</p>
            <p>Click the link below to sign in (valid 15 minutes):</p>
            <p><a href="${url}">${url}</a></p>
          `,
        });
      },
    }),
  ],
  pages: { signIn: "/signin" },
  session: { strategy: "jwt" },
};

export function serverSession() {
  return getServerSession(authOptions);
}
