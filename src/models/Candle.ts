import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { TIMEFRAMES, type Timeframe } from "@/lib/priceFeed/timeframes";

export { TIMEFRAMES, type Timeframe };

const candleSchema = new Schema(
  {
    symbol: { type: String, required: true, uppercase: true, trim: true }, // e.g. "RELIANCE"
    timeframe: { type: String, enum: TIMEFRAMES, required: true },
    time: { type: Number, required: true }, // unix seconds, candle open time (UTC)

    open: { type: Number, required: true },
    high: { type: Number, required: true },
    low: { type: Number, required: true },
    close: { type: Number, required: true },
    volume: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

candleSchema.index({ symbol: 1, timeframe: 1, time: 1 }, { unique: true });

export type CandleDoc = InferSchemaType<typeof candleSchema>;

export const Candle: Model<CandleDoc> = models.Candle ?? model<CandleDoc>("Candle", candleSchema);
