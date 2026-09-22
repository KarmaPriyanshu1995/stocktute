import { getRedis } from "@/lib/redis/client";
import nodemailer from "nodemailer";

const OTP_TTL_SECONDS = 10 * 60;
const otpKey = (email: string) => `otp:${email.toLowerCase()}`;

const istDateTime = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  dateStyle: "medium",
  timeStyle: "short",
  hour12: true,
});

function generateCode(): string {
  return Math.floor(100_000 + Math.random() * 900_000).toString();
}

function matchesStored(stored: string | number | null, code: string): boolean {
  return stored !== null && String(stored) === code.trim();
}

/** Generates a 6-digit OTP, stores it in Redis with a 10-minute TTL, and emails it. */
export async function requestOtp(email: string): Promise<void> {
  const code = generateCode();
  await getRedis().set(otpKey(email), code, { ex: OTP_TTL_SECONDS });

  const sentAt = new Date();
  const expiresAt = new Date(sentAt.getTime() + OTP_TTL_SECONDS * 1000);
  const sentAtIst = istDateTime.format(sentAt);
  const expiresAtIst = istDateTime.format(expiresAt);

  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });

  const text = [
    `Your Stocktute verification code is ${code}.`,
    "",
    `Sent at ${sentAtIst} IST.`,
    `This code expires in 10 minutes (by ${expiresAtIst} IST).`,
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");

  await transport.sendMail({
    to: email,
    from: process.env.EMAIL_FROM,
    subject: `${code} is your Stocktute verification code`,
    text,
    html: `<p>Your Stocktute verification code is <strong>${code}</strong>.</p>
<p>Sent at ${sentAtIst} IST.<br/>This code expires in 10 minutes (by ${expiresAtIst} IST).</p>
<p>If you did not request this, you can ignore this email.</p>`,
  });
}

/** Checks a submitted OTP against Redis without consuming it. */
export async function verifyOtp(email: string, code: string): Promise<boolean> {
  const stored = await getRedis().get<string | number>(otpKey(email));
  return matchesStored(stored, code);
}

/** Deletes the OTP after a successful sign-in so it cannot be reused. */
export async function consumeOtp(email: string, code: string): Promise<void> {
  const redis = getRedis();
  const key = otpKey(email);
  const stored = await redis.get<string | number>(key);
  if (matchesStored(stored, code)) {
    await redis.del(key);
  }
}
