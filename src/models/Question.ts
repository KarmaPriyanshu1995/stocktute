import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const SKILL_TREE_TOPICS = [
  "basics",
  "candlesticks",
  "structure",
  "indicators",
  "risk",
  "strategies",
] as const;

const optionSchema = new Schema(
  {
    label: { type: String, required: true },
    isCorrect: { type: Boolean, required: true, default: false },
  },
  { _id: false },
);

const questionSchema = new Schema(
  {
    topic: { type: String, enum: SKILL_TREE_TOPICS, required: true, index: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },

    type: {
      type: String,
      enum: ["spot-the-pattern", "place-the-stop", "risk-reward-calc", "scenario-decision"],
      required: true,
    },

    prompt: { type: String, required: true, trim: true },

    // Chart snippet is rendered on the fly from symbol + a candle range, not stored as an image
    chartSnippet: {
      symbol: { type: String, uppercase: true },
      timeframe: { type: String },
      fromTime: { type: Number }, // unix seconds
      toTime: { type: Number },
      annotateIndex: { type: Number }, // candle index the question centers on, if applicable
    },

    options: {
      type: [optionSchema],
      validate: {
        validator: (opts: { isCorrect: boolean }[]) => opts.filter((o) => o.isCorrect).length >= 1,
        message: "Question must have at least one correct option",
      },
    },

    explanation: { type: String, required: true, trim: true },

    // Deterministic detector rule this question reinforces (e.g. "hammer", "ema-cross")
    sourceRule: { type: String, required: true },

    // SM-2 spaced repetition defaults are stored per-user-per-question in a
    // separate join collection (UserQuestionProgress), not here.
  },
  { timestamps: true },
);

export type QuestionDoc = InferSchemaType<typeof questionSchema>;

export const Question: Model<QuestionDoc> =
  models.Question ?? model<QuestionDoc>("Question", questionSchema);
