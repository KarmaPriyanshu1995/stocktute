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

/** Wrong 5-bar prediction, with the engine snapshot so the student can replay it. */
const mistakeJournalEntrySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    prediction: { type: Schema.Types.ObjectId, ref: "Prediction", required: true },
    chartKey: { type: String, required: true, trim: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    timeframe: { type: String, required: true },
    patternName: { type: String, required: true },
    direction: { type: String, enum: ["up", "down", "sideways"], required: true },
    confidence: { type: Number, required: true },
    reason: { type: String, required: true, trim: true },
    actual: { type: String, enum: ["up", "down", "sideways"], default: null },
    closeReturnPct: { type: Number, default: null },
    reasoningScore: { type: Number, default: null },
    outcomeResult: { type: String, enum: ["hit", "miss", "sideways-band", "unavailable"], default: null },
    tags: { type: [String], default: [] },
    snapshot: {
      candles: { type: [ohlcvSchema], required: true },
      setup: { type: Schema.Types.Mixed, required: true },
    },
  },
  { timestamps: true },
);

mistakeJournalEntrySchema.index({ user: 1, chartKey: 1 }, { unique: true });
mistakeJournalEntrySchema.index({ user: 1, updatedAt: -1 });

export type MistakeJournalEntryDoc = InferSchemaType<typeof mistakeJournalEntrySchema>;

export const MistakeJournalEntry: Model<MistakeJournalEntryDoc> =
  models.MistakeJournalEntry ??
  model<MistakeJournalEntryDoc>("MistakeJournalEntry", mistakeJournalEntrySchema);
