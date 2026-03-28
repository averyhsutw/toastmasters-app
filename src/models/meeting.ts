import mongoose, { Schema, type InferSchemaType } from "mongoose";

const meetingSchema = new Schema(
  {
    meetingDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["draft", "open", "finalized"],
      default: "draft",
    },
    topic: { type: String, default: "" },
    toastmasterAssignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      default: null,
    },
    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export type IMeeting = InferSchemaType<typeof meetingSchema> & { _id: string };

export const Meeting =
  mongoose.models.Meeting || mongoose.model("Meeting", meetingSchema);
