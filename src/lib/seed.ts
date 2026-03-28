/**
 * Seed script to create demo accounts.
 *
 * Usage: npx tsx src/lib/seed.ts
 *
 * Requires MONGODB_URI in .env or .env.local
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined");
  process.exit(1);
}

const userSchema = new mongoose.Schema(
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

const User = mongoose.model("User", userSchema);

const DEMO_USERS = [
  { name: "Secretary Lin", email: "secretary@demo.com", systemRole: "secretary" },
  { name: "Alice Chen", email: "alice@demo.com", systemRole: "member" },
  { name: "Bob Wang", email: "bob@demo.com", systemRole: "member" },
  { name: "Carol Hsu", email: "carol@demo.com", systemRole: "member" },
  { name: "David Lee", email: "david@demo.com", systemRole: "member" },
  { name: "Emily Liu", email: "emily@demo.com", systemRole: "member" },
  { name: "Frank Chang", email: "frank@demo.com", systemRole: "member" },
  { name: "Grace Wu", email: "grace@demo.com", systemRole: "member" },
];

const DEFAULT_PASSWORD = "password123";

async function seed() {
  await mongoose.connect(MONGODB_URI!);
  console.log("Connected to MongoDB");

  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const u of DEMO_USERS) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log(`  Skipped (exists): ${u.email}`);
      continue;
    }
    await User.create({ ...u, passwordHash: hash });
    console.log(`  Created: ${u.email} [${u.systemRole}]`);
  }

  console.log("Seed complete");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
