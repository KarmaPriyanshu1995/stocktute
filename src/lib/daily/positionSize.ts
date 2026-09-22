export function virtualPositionSize(input: {
  capital: number;
  riskPct: number;
  entry: number;
  invalidation: number;
}):
  | {
      shares: number;
      rupeeRisk: number;
      perShare: number;
      notional: number;
      side: "long-study" | "short-study";
    }
  | { error: string } {
  const rupeeRisk = input.capital * (input.riskPct / 100);
  const perShare = Math.abs(input.entry - input.invalidation);
  if (perShare <= 0) {
    return { error: "I don't have a usable invalidation distance for this snapshot." };
  }
  const shares = Math.floor(rupeeRisk / perShare);
  const side = input.invalidation < input.entry ? "long-study" : "short-study";
  return {
    shares,
    rupeeRisk,
    perShare,
    notional: shares * input.entry,
    side,
  };
}
