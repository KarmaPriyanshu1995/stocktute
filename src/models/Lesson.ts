import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { SKILL_TREE_TOPICS } from "./Question";

const lessonSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },

    topic: { type: String, enum: SKILL_TREE_TOPICS, required: true, index: true },
    order: { type: Number, required: true, default: 0 }, // position within the skill-tree node

    // Original markdown content (never scraped/copied)
    contentMd: { type: String, required: true },

    youtubeEmbedIds: { type: [String], default: [] },

    reviewStatus: {
      type: String,
      enum: ["draft", "partner-reviewed", "published"],
      default: "draft",
      index: true,
    },

    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    publishedAt: { type: Date },

    estimatedMinutes: { type: Number, default: 5 },
  },
  { timestamps: true },
);

export type LessonDoc = InferSchemaType<typeof lessonSchema>;

export const Lesson: Model<LessonDoc> = models.Lesson ?? model<LessonDoc>("Lesson", lessonSchema);
