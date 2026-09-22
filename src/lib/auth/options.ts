import { CredentialsSignin, type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { consumeOtp, verifyOtp } from "./otp";

class InvalidOtpError extends CredentialsSignin {
  code = "invalid_otp";
}

class DatabaseUnavailableError extends CredentialsSignin {
  code = "database_unavailable";
}

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    verifyRequest: "/verify",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      id: "email-otp",
      name: "Email code",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const code = credentials?.code as string | undefined;
        if (!email || !code) throw new InvalidOtpError();

        const valid = await verifyOtp(email, code);
        if (!valid) throw new InvalidOtpError();

        try {
          await connectToDatabase();
          const user = await User.findOneAndUpdate(
            { email: email.toLowerCase() },
            { $setOnInsert: { email: email.toLowerCase(), provider: "email" } },
            { upsert: true, new: true },
          );

          await consumeOtp(email, code);
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name ?? undefined,
            tier: user.tier ?? "free",
            role: user.role ?? "student",
          };
        } catch (error) {
          if (error instanceof CredentialsSignin) throw error;
          console.error("[auth] database error during email-otp sign-in", error);
          throw new DatabaseUnavailableError();
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        await connectToDatabase();
        await User.findOneAndUpdate(
          { email: user.email.toLowerCase() },
          {
            $setOnInsert: { email: user.email.toLowerCase(), provider: "google" },
            $set: { name: user.name, image: user.image },
          },
          { upsert: true },
        );
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id && user.tier && user.role) {
        token.userId = user.id;
        token.tier = user.tier;
        token.role = user.role;
        return token;
      }

      if (user?.email) {
        await connectToDatabase();
        const dbUser = await User.findOne({ email: user.email.toLowerCase() });
        if (dbUser) {
          token.userId = dbUser._id.toString();
          token.tier = dbUser.tier;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.tier = token.tier as "free" | "lab";
        session.user.role = token.role as "student" | "admin";
      }
      return session;
    },
  },
};
