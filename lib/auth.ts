import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24, // 1 day
  },

  jwt: {
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },

  providers: [
    /* ===================== ADMIN LOGIN ===================== */
    CredentialsProvider({
      id: "admin-credentials",
      name: "AdminCredentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email },
        });

        if (!admin) return null;
        if (admin.status !== "ACTIVE") return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          admin.passwordHash
        );

        if (!isValid) return null;

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: "ADMIN",
        } as any;
      },
    }),

    /* ===================== MERCHANT LOGIN ===================== */
    CredentialsProvider({
      id: "merchant-credentials",
      name: "MerchantCredentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const merchant = await prisma.merchant.findUnique({
          where: { email: credentials.email },
        });

        if (!merchant) return null;
        if (merchant.status !== "ACTIVE") return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          merchant.passwordHash
        );

        if (!isValid) return null;

        return {
          id: merchant.id,
          email: merchant.email,
          name: merchant.name,
          role: "MERCHANT",
        } as any;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
