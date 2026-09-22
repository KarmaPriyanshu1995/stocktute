import { NextResponse } from "next/server";
import { z } from "zod";
import { requestOtp } from "@/lib/auth/otp";

const bodySchema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  await requestOtp(parsed.data.email);
  return NextResponse.json({ ok: true });
}
