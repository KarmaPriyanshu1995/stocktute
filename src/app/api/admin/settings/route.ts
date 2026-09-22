import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AppSettings } from "@/models/AppSettings";

const bodySchema = z.object({ autoPublishDaily: z.boolean() });

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Admin required" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "autoPublishDaily required" }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const settings = await AppSettings.findOneAndUpdate(
      { key: "site" },
      { $set: { autoPublishDaily: parsed.data.autoPublishDaily } },
      { upsert: true, new: true },
    );
    return NextResponse.json({ ok: true, autoPublishDaily: settings.autoPublishDaily });
  } catch (error) {
    console.error("[settings] save failed", error);
    return NextResponse.json({ error: "Could not save settings" }, { status: 503 });
  }
}
