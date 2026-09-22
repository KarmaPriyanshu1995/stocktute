import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";

const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },

    side: { type: String, enum: ["buy", "sell"], required: true },
    type: { type: String, enum: ["market", "limit", "stop"], required: true },
    quantity: { type: Number, required: true, min: 1 },

    // Required for limit/stop orders; ignored for market orders
    triggerPrice: { type: Number },

    status: {
      type: String,
      enum: ["pending", "filled", "cancelled", "rejected"],
      default: "pending",
      index: true,
    },

    // Fill details, set once matched against the cached price
    filledPrice: { type: Number },
    filledAt: { type: Date },
    brokerage: { type: Number, default: 0 },

    // Optional link back to a replay session if placed during chart replay
    replaySessionId: { type: Types.ObjectId },

    // Student's written rationale — required to encourage disciplined trading
    plan: { type: String, trim: true, maxlength: 2000 },

    rejectionReason: { type: String },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, status: 1, createdAt: -1 });

export type OrderDoc = InferSchemaType<typeof orderSchema>;

export const Order: Model<OrderDoc> = models.Order ?? model<OrderDoc>("Order", orderSchema);
