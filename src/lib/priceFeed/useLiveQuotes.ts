"use client";

import { useEffect, useRef, useState } from "react";
import type { Quote } from "./PriceProvider";

/**
 * Subscribes to /api/stream for the given symbols and keeps the latest
 * quote per symbol in state. Reconnects automatically (native EventSource
 * behavior) if the connection drops.
 */
export function useLiveQuotes(symbols: readonly string[]) {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const symbolsKey = symbols.join(",");
  const prevRef = useRef<Record<string, Quote>>({});

  useEffect(() => {
    if (!symbolsKey) return;

    const source = new EventSource(`/api/stream?symbols=${encodeURIComponent(symbolsKey)}`);

    source.addEventListener("quotes", (event) => {
      const incoming = JSON.parse((event as MessageEvent).data) as Quote[];
      const next = { ...prevRef.current };
      for (const q of incoming) next[q.symbol] = q;
      prevRef.current = next;
      setQuotes(next);
    });

    return () => source.close();
  }, [symbolsKey]);

  return quotes;
}
