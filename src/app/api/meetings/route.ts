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

  const meetings = await Meeting.find()
    .sort({ meetingDate: -1 })
    .lean();

  return NextResponse.json({
    meetings: meetings.map((m) => ({
      id: m._id.toString(),
      meetingDate: m.meetingDate,
      status: m.status,
      topic: m.topic,
      createdByUserId: m.createdByUserId.toString(),
    })),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.systemRole !== "secretary") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { meetingDate } = await request.json();
  if (!meetingDate) {
    return NextResponse.json(
      { error: "meetingDate is required" },
      { status: 400 }
    );
  }

  await connectDB();

  const meeting = await Meeting.create({
    meetingDate: new Date(meetingDate),
    status: "draft",
    createdByUserId: session.userId,
  });

  return NextResponse.json(
    {
      meeting: {
        id: meeting._id.toString(),
        meetingDate: meeting.meetingDate,
        status: meeting.status,
        topic: meeting.topic,
        toastmasterAssignmentId: null,
        createdByUserId: meeting.createdByUserId.toString(),
      },
    },
    { status: 201 }
  );
}
