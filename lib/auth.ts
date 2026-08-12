import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./db";
import { rateLimit } from "./rateLimit";
import type { Role } from "@prisma/client";

const authSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
if (!authSecret) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXTAUTH_SECRET (or AUTH_SECRET) must be set in production");
  }
  console.warn(
    "NEXTAUTH_SECRET is not set — using an insecure development-only fallback secret."
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  trustHost: true,
  secret: authSecret || "dev-only-insecure-secret-do-not-use-in-production",
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID,
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      id: "email-otp",
      name: "Email OTP",
      credentials: {
        email: { label: "Email Address", type: "email" },
        otp: { label: "OTP Code", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const otp = credentials?.otp as string;
        if (!email || !otp) return null;

        const cleanEmail = email.toLowerCase().trim();

        if (!rateLimit(`login-otp:${cleanEmail}`, 10, 15 * 60 * 1000)) return null;

        // Check DB for matching OTP or demo OTP (123456, dev-only)
        const validRecord = await db.emailOtp.findFirst({
          where: {
            email: cleanEmail,
            otp,
            expiresAt: { gt: new Date() },
          },
        });

        const isDemoOtp = process.env.NODE_ENV !== "production" && otp === "123456";

        if (!validRecord && !isDemoOtp) return null;

        if (validRecord) {
          await db.emailOtp.delete({ where: { id: validRecord.id } });
        }

        let user = await db.user.findUnique({ where: { email: cleanEmail } });

        if (!user) {
          user = await db.user.create({
            data: {
              email: cleanEmail,
              name: cleanEmail.split("@")[0],
              role: "CUSTOMER",
            },
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
    Credentials({
      id: "admin",
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        if (!email || !password) return null;

        if (!rateLimit(`admin-login:${email.toLowerCase().trim()}`, 5, 15 * 60 * 1000)) {
          return null;
        }

        const isProd = process.env.NODE_ENV === "production";
        const expectedEmail =
          process.env.ADMIN_EMAIL || (isProd ? undefined : "admin@quickcart.com");
        const expectedPassword =
          process.env.ADMIN_PASSWORD || (isProd ? undefined : "admin123");

        if (!expectedEmail || !expectedPassword) {
          console.error("ADMIN_EMAIL / ADMIN_PASSWORD are not configured");
          return null;
        }

        if (
          email.toLowerCase().trim() !== expectedEmail.toLowerCase().trim() ||
          password !== expectedPassword
        ) {
          return null;
        }

        let user = await db.user.findUnique({
          where: { email: expectedEmail },
        });

        if (!user) {
          user = await db.user.create({
            data: {
              email: expectedEmail,
              name: "Store Admin",
              role: "ADMIN",
            },
          });
        } else if (user.role !== "ADMIN") {
          user = await db.user.update({
            where: { id: user.id },
            data: { role: "ADMIN" },
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: Role }).role || "CUSTOMER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as Role) || "CUSTOMER";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
