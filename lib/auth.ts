import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./db";
import type { Role } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  trustHost: true,
  secret:
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "97DeeDClFn/t/CYSNcUnbTi7NlwEAufnOLkXDAq8W4g=",
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

        // Check DB for matching OTP or demo OTP (123456)
        const validRecord = await db.emailOtp.findFirst({
          where: {
            email: cleanEmail,
            otp,
            expiresAt: { gt: new Date() },
          },
        });

        const isDemoOtp = otp === "123456";

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

        const expectedEmail = process.env.ADMIN_EMAIL || "admin@quickcart.com";
        const expectedPassword = process.env.ADMIN_PASSWORD || "admin123";

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
