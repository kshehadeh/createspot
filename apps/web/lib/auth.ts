import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { sendWelcomeEmailIfNeeded } from "./send-welcome-email";

const isProduction = process.env.NODE_ENV === "production";
const useSecureCookies =
  process.env.NEXTAUTH_URL?.startsWith("https://") ?? isProduction;

export const { handlers, signIn, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
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
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // Fetch isAdmin and profileImageUrl from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
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
          sendWelcomeEmailIfNeeded(user.id).catch((error) => {
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
