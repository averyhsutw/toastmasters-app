import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Meeting } from "@/models/meeting";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  // Find the most recent meeting that is not finalized, or the latest finalized one
  const meeting = await Meeting.findOne({
    status: { $in: ["draft", "open"] },
  })
    .sort({ meetingDate: -1 })
    .lean();

  if (!meeting) {
    return NextResponse.json({ meeting: null });
  }

  return NextResponse.json({
    meeting: {
      id: meeting._id.toString(),
      meetingDate: meeting.meetingDate,
      status: meeting.status,
      topic: meeting.topic,
      toastmasterAssignmentId: meeting.toastmasterAssignmentId?.toString() ?? null,
      createdByUserId: meeting.createdByUserId.toString(),
    },
  });
}
