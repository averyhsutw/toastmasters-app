import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Task } from "@/models/task";
import { Meeting } from "@/models/meeting";
import { Assignment } from "@/models/assignment";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const tasks = await Task.find({ assigneeUserId: session.userId })
    .sort({ createdAt: -1 })
    .lean();

  if (tasks.length === 0) {
    return NextResponse.json({ tasks: [] });
  }

  // Batch-fetch related meetings and assignments
  const meetingIds = [...new Set(tasks.map((t) => t.meetingId.toString()))];
  const assignmentIds = [...new Set(tasks.map((t) => t.assignmentId.toString()))];

  const [meetings, assignments] = await Promise.all([
    Meeting.find({ _id: { $in: meetingIds } }).lean(),
    Assignment.find({ _id: { $in: assignmentIds } }).lean(),
  ]);

  const meetingMap = new Map(meetings.map((m) => [m._id.toString(), m]));
  const assignmentMap = new Map(assignments.map((a) => [a._id.toString(), a]));

  const result = tasks.map((t) => {
    const meeting = meetingMap.get(t.meetingId.toString());
    const assignment = assignmentMap.get(t.assignmentId.toString());

    return {
      id: t._id.toString(),
      taskType: t.taskType,
      title: t.title,
      status: t.status,
      answerText: t.answerText,
      meetingId: t.meetingId.toString(),
      assignmentId: t.assignmentId.toString(),
      meetingDate: meeting?.meetingDate ?? null,
      meetingStatus: meeting?.status ?? null,
      roleName: assignment?.roleName ?? null,
    };
  });

  return NextResponse.json({ tasks: result });
}
