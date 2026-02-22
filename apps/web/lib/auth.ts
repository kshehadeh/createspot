import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { verifyPassword } from "./password";
import { sendWelcomeEmailIfNeeded } from "./send-welcome-email";

const isProduction = process.env.NODE_ENV === "production";
const useSecureCookies =
  process.env.NEXTAUTH_URL?.startsWith("https://") ?? isProduction;

const credentialsProvider = Credentials({
  credentials: {
    username: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    const email = credentials?.username;
    const password = credentials?.password;
    if (
      !email ||
      !password ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return null;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        passwordHash: true,
      },
    });
    if (
      !user?.passwordHash ||
      !(await verifyPassword(password, user.passwordHash))
    ) {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    };
  },
});

const providers = [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
  ...(isProduction ? [] : [credentialsProvider]),
];

export const { handlers, signIn, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  providers,
  session: {
    // Credentials + adapter is most reliable with JWT sessions in non-production.
    strategy: isProduction ? "database" : "jwt",
  },
  cookies: {
    pkceCodeVerifier: {
      name: useSecureCookies
        ? "__Secure-authjs.pkce.code_verifier"
        : "authjs.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  callbacks: {
    async session({ session, user, token }) {
      const userId = user?.id ?? token?.sub;
      if (session.user && userId) {
        session.user.id = userId;
        // Fetch isAdmin and profileImageUrl from database
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            isAdmin: true,
            profileImageUrl: true,
            welcomeEmailSent: true,
            slug: true,
          },
        });
        session.user.isAdmin = dbUser?.isAdmin ?? false;
        session.user.profileImageUrl = dbUser?.profileImageUrl ?? null;
        session.user.slug = dbUser?.slug ?? null;

        // Send welcome email if needed (fire and forget - don't block session creation)
        if (dbUser && !dbUser.welcomeEmailSent) {
          // Send asynchronously without blocking the session callback
          sendWelcomeEmailIfNeeded(userId).catch((error) => {
            console.error("[Auth] Failed to send welcome email:", error);
          });
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/welcome",
  },
});
