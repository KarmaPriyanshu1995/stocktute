import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const positionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },

    quantity: { type: Number, required: true }, // net open quantity; positions close (deleted) at 0
    avgPrice: { type: Number, required: true },

    // Snapshot fields updated on each price tick for fast dashboard reads;
    // the authoritative P&L is always recomputed from Trade history.
    lastPrice: { type: Number },
    unrealisedPnl: { type: Number, default: 0 },
    realisedPnl: { type: Number, default: 0 }, // cumulative realised P&L for this symbol
  },
  { timestamps: true },
);

positionSchema.index({ user: 1, symbol: 1 }, { unique: true });

export type PositionDoc = InferSchemaType<typeof positionSchema>;

export const Position: Model<PositionDoc> =
  models.Position ?? model<PositionDoc>("Position", positionSchema);
