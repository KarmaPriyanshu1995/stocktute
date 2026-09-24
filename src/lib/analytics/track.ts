import { ANALYTICS_EVENTS, type AnalyticsEvent } from "@/config/education";

export type { AnalyticsEvent };
export { ANALYTICS_EVENTS };

/**
 * Env-gated PostHog capture via HTTP. No-ops without NEXT_PUBLIC_POSTHOG_KEY.
 * No SDK dependency — fetch only.
 */
export function track(event: AnalyticsEvent, props: Record<string, unknown> = {}): void {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  if (!(ANALYTICS_EVENTS as readonly string[]).includes(event)) return;

  const host = (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com").replace(/\/$/, "");
  const distinctId = typeof props.distinctId === "string" ? props.distinctId : "anonymous";

  void fetch(`${host}/capture/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: key,
      event,
      properties: { ...props, distinct_id: distinctId },
    }),
  }).catch(() => undefined);
}
