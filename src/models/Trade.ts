import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * A Trade represents a closed round-trip (entry + exit) built from one or more
 * filled Orders. Created when a position is fully or partially closed.
 */
const tradeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },

    side: { type: String, enum: ["long", "short"], required: true },
    quantity: { type: Number, required: true },

    entryOrder: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    exitOrder: { type: Schema.Types.ObjectId, ref: "Order", required: true },

    entryPrice: { type: Number, required: true },
    exitPrice: { type: Number, required: true },
    entryAt: { type: Date, required: true },
    exitAt: { type: Date, required: true },

    brokerage: { type: Number, default: 0 },
    pnl: { type: Number, required: true }, // realised P&L net of brokerage
    pnlPercent: { type: Number, required: true },

    // Student's written plan captured at entry (thesis, stop, target)
    plan: { type: String, trim: true, maxlength: 2000 },

    // Was this trade placed live or inside chart replay?
    context: { type: String, enum: ["live", "replay"], default: "live" },

    // AI trade reviewer output (Phase 6) — structured JSON, nullable until reviewed
    review: {
      entryQuality: { type: String },
      exitQuality: { type: String },
      sizing: { type: String },
      planAdherence: { type: String },
      habitToFix: { type: String },
      reviewedAt: { type: Date },
    },
  },
  { timestamps: true },
);

tradeSchema.index({ user: 1, exitAt: -1 });

export type TradeDoc = InferSchemaType<typeof tradeSchema>;

export const Trade: Model<TradeDoc> = models.Trade ?? model<TradeDoc>("Trade", tradeSchema);
