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
      id: "phone",
      name: "Phone Number OTP",
      credentials: {
        phone: { label: "Phone Number", type: "text" },
      },
      async authorize(credentials) {
        const phone = credentials?.phone as string;
        if (!phone) return null;

        const cleanPhone = phone.replace(/\D/g, "");
        if (cleanPhone.length < 10) return null;

        // Upsert user by phone
        let user = await db.user.findUnique({ where: { phone: cleanPhone } });

        if (!user) {
          user = await db.user.create({
            data: {
              phone: cleanPhone,
              name: `Customer ${cleanPhone.slice(-4)}`,
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
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        if (!email) return null;

        let user = await db.user.findUnique({ where: { email } });

        if (!user) {
          user = await db.user.create({
            data: {
              email,
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
