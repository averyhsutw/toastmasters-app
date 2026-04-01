import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Meeting } from "@/models/meeting";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();

  const meeting = await Meeting.findById(id).lean();
  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
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

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["open"],
  open: ["finalized"],
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.systemRole !== "secretary") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await request.json();

  if (!status) {
    return NextResponse.json({ error: "status is required" }, { status: 400 });
  }

  await connectDB();

  const meeting = await Meeting.findById(id);
  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  const allowed = VALID_TRANSITIONS[meeting.status] ?? [];
  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: `Cannot transition from ${meeting.status} to ${status}` },
      { status: 422 }
    );
  }

  meeting.status = status;
  await meeting.save();

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
