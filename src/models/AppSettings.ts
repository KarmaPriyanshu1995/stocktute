import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const appSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "site" },
    autoPublishDaily: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type AppSettingsDoc = InferSchemaType<typeof appSettingsSchema>;

export const AppSettings: Model<AppSettingsDoc> =
  models.AppSettings ?? model<AppSettingsDoc>("AppSettings", appSettingsSchema);
