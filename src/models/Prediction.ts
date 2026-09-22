import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const ohlcvSchema = new Schema(
  {
    time: { type: Number, required: true },
    open: { type: Number, required: true },
    high: { type: Number, required: true },
    low: { type: Number, required: true },
    close: { type: Number, required: true },
    volume: { type: Number, required: true },
  },
  { _id: false },
);

/**
 * One locked predict-and-reveal per user per teaching chart.
 * Snapshot + DetectedSetup are copies from the engine, never from the LLM.
 */
const predictionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    chartKey: { type: String, required: true, trim: true },
    source: { type: String, enum: ["classroom", "daily"], required: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    timeframe: { type: String, required: true },
    patternName: { type: String, required: true },

    direction: { type: String, enum: ["up", "down", "sideways"], required: true },
    confidence: { type: Number, required: true, min: 50, max: 100 },
    reason: { type: String, required: true, trim: true, maxlength: 500 },

    actual: { type: String, enum: ["up", "down", "sideways"], default: null },
    closeReturnPct: { type: Number, default: null },
    matched: { type: Boolean, default: null },
    tags: { type: [String], default: [] },

    snapshot: {
      candles: { type: [ohlcvSchema], required: true },
      setup: { type: Schema.Types.Mixed, required: true },
    },
  },
  { timestamps: true },
);

predictionSchema.index({ user: 1, chartKey: 1 }, { unique: true });

export type PredictionDoc = InferSchemaType<typeof predictionSchema>;

export const Prediction: Model<PredictionDoc> =
  models.Prediction ?? model<PredictionDoc>("Prediction", predictionSchema);
