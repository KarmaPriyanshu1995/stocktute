import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const sectionSchema = new Schema(
  {
    id: { type: String, required: true },
    minLevel: { type: Number, required: true },
    title: { type: String, required: true },
    paragraphs: { type: [String], default: [] },
    chart: { type: Schema.Types.Mixed },
    charts: { type: Schema.Types.Mixed },
    quiz: { type: Schema.Types.Mixed },
    extras: { type: Schema.Types.Mixed },
  },
  { _id: false },
);

const dailyChapterSchema = new Schema(
  {
    date: { type: String, required: true, unique: true }, // YYYY-MM-DD IST session
    status: {
      type: String,
      enum: ["draft", "approved", "rejected", "published"],
      default: "draft",
      index: true,
    },
    autoPublish: { type: Boolean, default: false },
    source: { type: String, enum: ["synthetic-eod", "vendor"], default: "synthetic-eod" },
    disclaimer: { type: String, required: true },
    sections: { type: [sectionSchema], default: [] },
    compliance: {
      blockedCount: { type: Number, default: 0 },
      hits: { type: [Schema.Types.Mixed], default: [] },
    },
    skipReason: { type: String, enum: ["weekend", "holiday"] },
    reviewer: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    reviewNote: { type: String, trim: true, maxlength: 2000 },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export type DailyChapterDoc = InferSchemaType<typeof dailyChapterSchema>;

export const DailyChapter: Model<DailyChapterDoc> =
  models.DailyChapter ?? model<DailyChapterDoc>("DailyChapter", dailyChapterSchema);
