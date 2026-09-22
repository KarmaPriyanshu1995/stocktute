import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");
  return session;
}

export async function authorizeChapterJob(req: Request) {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization");
  if (secret && header === `Bearer ${secret}`) return { via: "cron" as const, userId: null };

  const session = await auth();
  if (session?.user?.role === "admin" && session.user.id) {
    return { via: "admin" as const, userId: session.user.id };
  }
  return null;
}
