import { getRedis, redisKeys } from "@/lib/redis/client";
import type { Quote } from "@/lib/priceFeed/PriceProvider";

export const dynamic = "force-dynamic";

const POLL_MS = 2000;

/**
 * SSE endpoint pushing live quotes to the browser. Polls Redis (written by
 * the price feed worker) rather than holding an in-process subscription,
 * since the worker and this route run as separate processes/serverless
 * invocations.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbols = (searchParams.get("symbols") ?? "").split(",").filter(Boolean);

  if (symbols.length === 0) {
    return new Response("symbols query param is required", { status: 400 });
  }

  const encoder = new TextEncoder();
  const redis = getRedis();

  let closed = false;
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const poll = async () => {
        if (closed) return;
        try {
          const quotes = await Promise.all(
            symbols.map((s) => redis.get<Quote | string>(redisKeys.latestQuoteKey(s))),
          );
          const parsed = quotes
            .filter((q): q is Quote | string => q !== null)
            .map((q) => (typeof q === "string" ? (JSON.parse(q) as Quote) : q));

          if (parsed.length > 0) send("quotes", parsed);
        } catch (err) {
          send("error", { message: err instanceof Error ? err.message : "poll failed" });
        }
      };

      poll();
      const interval = setInterval(poll, POLL_MS);
      const heartbeat = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(`: heartbeat\n\n`));
      }, 15_000);

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
