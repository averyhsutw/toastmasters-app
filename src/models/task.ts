import mongoose, { Schema, type InferSchemaType } from "mongoose";

const taskSchema = new Schema(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
    },
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    assigneeUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    taskType: { type: String, required: true },
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    answerText: { type: String, default: "" },
  },
  { timestamps: true }
);

taskSchema.index({ assigneeUserId: 1, meetingId: 1 });
taskSchema.index({ assignmentId: 1 });

export type ITask = InferSchemaType<typeof taskSchema> & { _id: string };

export const Task =
  mongoose.models.Task || mongoose.model("Task", taskSchema);
