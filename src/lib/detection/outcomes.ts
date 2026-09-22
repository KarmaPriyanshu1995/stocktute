import type { ExpectedMove, ForwardOutcome, Ohlcv, PatternBias } from "./types";
import { FORWARD_HORIZONS, SIDEWAYS_BAND_PCT } from "./types";
import { pctChange, round } from "./geometry";

export function expectedMoveFromBias(bias: PatternBias): ExpectedMove {
  if (bias === "bullish") return "up";
  if (bias === "bearish") return "down";
  return "sideways";
}

export function hitExpected(move: ExpectedMove, returnPct: number): boolean {
  if (move === "up") return returnPct > 0;
  if (move === "down") return returnPct < 0;
  return Math.abs(returnPct) <= SIDEWAYS_BAND_PCT;
}

/** Forward closes after `endIndex`. Missing horizons stay null — the LLM must not invent them. */
export function forwardOutcomes(
  candles: Ohlcv[],
  endIndex: number,
  patternClose: number,
  expectedMove: ExpectedMove,
): ForwardOutcome[] {
  return FORWARD_HORIZONS.map((bars) => {
    const at = endIndex + bars;
    if (at >= candles.length) {
      return { bars, closeReturnPct: null, hitExpected: null };
    }
    const closeReturnPct = round(pctChange(patternClose, candles[at].close), 4);
    return {
      bars,
      closeReturnPct,
      hitExpected: hitExpected(expectedMove, closeReturnPct),
    };
  });
}
