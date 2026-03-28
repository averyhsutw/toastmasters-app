import mongoose, { Schema, type InferSchemaType } from "mongoose";

const assignmentSchema = new Schema(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
    },
    roleName: { type: String, required: true },
    roleType: { type: String, required: true },
    assigneeUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    confirmationStatus: {
      type: String,
      enum: ["pending", "confirmed", "declined"],
      default: "pending",
    },
    isAgendaRelevant: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

assignmentSchema.index({ meetingId: 1, sortOrder: 1 });

export type IAssignment = InferSchemaType<typeof assignmentSchema> & {
  _id: string;
};

export const Assignment =
  mongoose.models.Assignment ||
  mongoose.model("Assignment", assignmentSchema);
