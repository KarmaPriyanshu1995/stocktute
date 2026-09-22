import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    tier?: "free" | "lab";
    role?: "student" | "admin";
  }

  interface Session {
    user: {
      id: string;
      tier: "free" | "lab";
      role: "student" | "admin";
    } & DefaultSession["user"];
  }
}
