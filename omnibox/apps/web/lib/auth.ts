/* eslint-disable turbo/no-undeclared-env-vars */
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession, type NextAuthOptions } from "next-auth";
import prisma from "./prisma";
import { compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.hashedPassword || !user.emailVerified) return null;
        const valid = await compare(credentials.password, user.hashedPassword);
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
};

export function serverSession() {
  return getServerSession(authOptions);
}
