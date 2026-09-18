import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { CredentialsSignin } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema/auth";
import { ensureDefaultWorkspaceForUser } from "@/lib/db/provision-user-workspace";
import { consumeRateLimit, clientIp, RATE_LIMITS } from "@/lib/rate-limit";

/** Surfaced to the login page as `result.code === "RATE_LIMITED"`. */
class RateLimitedSignin extends CredentialsSignin {
  code = "RATE_LIMITED";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/verify-email",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        // Throttle password guessing per account and per client IP.
        const ip = request?.headers ? clientIp(request.headers) : "unknown";
        if (
          !consumeRateLimit(RATE_LIMITS.loginByIp, ip).allowed ||
          !consumeRateLimit(RATE_LIMITS.loginByEmail, email).allowed
        ) {
          throw new RateLimitedSignin();
        }

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // COPPA gate: parent email verification is mandatory before sign-in.
        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        // Repair migrated orphan accounts only after identity verification.
        // Existing billing state and original trial deadlines are preserved.
        ensureDefaultWorkspaceForUser(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
