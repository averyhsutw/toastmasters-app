import mongoose, { Schema, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    systemRole: {
      type: String,
      enum: ["member", "secretary"],
      default: "member",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type IUser = InferSchemaType<typeof userSchema> & { _id: string };

export const User =
  mongoose.models.User || mongoose.model("User", userSchema);
