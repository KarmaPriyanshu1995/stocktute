import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const complianceEventSchema = new Schema(
  {
    chapterDate: { type: String, required: true, index: true },
    sectionId: { type: String, default: "unknown" },
    phrase: { type: String, required: true },
    original: { type: String, required: true },
    suggestion: { type: String, default: "" },
    rewritten: { type: String, default: "" },
    resolved: { type: Boolean, default: false },
    resolution: { type: String, enum: ["rewritten", "accepted", "dismissed"] },
  },
  { timestamps: true },
);

export type ComplianceEventDoc = InferSchemaType<typeof complianceEventSchema>;

export const ComplianceEvent: Model<ComplianceEventDoc> =
  models.ComplianceEvent ?? model<ComplianceEventDoc>("ComplianceEvent", complianceEventSchema);
