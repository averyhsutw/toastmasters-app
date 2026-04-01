import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/user";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const members = await User.find({ isActive: true })
    .select("name email systemRole")
    .sort({ name: 1 })
    .lean();

  return NextResponse.json({
    members: members.map((m) => ({
      id: m._id.toString(),
      name: m.name,
      email: m.email,
      systemRole: m.systemRole,
    })),
  });
}
