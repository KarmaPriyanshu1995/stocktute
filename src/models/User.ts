import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, trim: true },
    image: { type: String },

    // Auth
    emailVerified: { type: Date },
    provider: { type: String, enum: ["google", "email"], required: true },

    // Subscription
    tier: { type: String, enum: ["free", "lab"], default: "free" },
    razorpaySubscriptionId: { type: String },
    subscriptionStatus: {
      type: String,
      enum: ["none", "active", "past_due", "cancelled"],
      default: "none",
    },
    subscriptionRenewsAt: { type: Date },

    // Paper trading wallet
    wallet: {
      balance: { type: Number, default: 500_000 },
      startingBalance: { type: Number, default: 500_000 },
    },

    // Curriculum access and classroom vocabulary (1–12). F&O stays locked until Level 6.
    level: { type: Number, default: 2, min: 1, max: 12 },
    xp: { type: Number, default: 0, min: 0 },
    language: { type: String, enum: ["en", "hi", "hinglish"], default: "en" },

    // Learning progress summary (denormalized for fast dashboard reads)
    progress: {
      streakDays: { type: Number, default: 0 },
      lastActiveAt: { type: Date },
      masteryByTopic: { type: Map, of: Number, default: {} }, // topic -> 0..100
    },

    role: { type: String, enum: ["student", "admin"], default: "student" },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema>;

export const User: Model<UserDoc> = models.User ?? model<UserDoc>("User", userSchema);
