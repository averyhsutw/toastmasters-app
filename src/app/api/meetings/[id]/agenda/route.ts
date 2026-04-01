import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Meeting } from "@/models/meeting";
import { Assignment } from "@/models/assignment";
import { Task } from "@/models/task";
import { User } from "@/models/user";

export interface AgendaData {
  meetingDate: string;
  status: string;
  topic: string;
  wordOfTheDay: string;
  roles: {
    roleName: string;
    assigneeName: string;
    confirmationStatus: string;
    dataItems: { label: string; value: string }[];
  }[];
  preparedSpeeches: {
    speakerName: string;
    projectName: string;
    speechTitle: string;
  }[];
  warnings: string[];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: meetingId } = await params;
  await connectDB();

  const meeting = await Meeting.findById(meetingId).lean();
  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  const assignments = await Assignment.find({ meetingId })
    .sort({ sortOrder: 1 })
    .lean();

  const userIds = [
    ...new Set(assignments.map((a) => a.assigneeUserId.toString())),
  ];
  const [users, tasks] = await Promise.all([
    User.find({ _id: { $in: userIds } }).select("name email").lean(),
    Task.find({ meetingId }).lean(),
  ]);

  const userMap = new Map(users.map((u) => [u._id.toString(), u]));
  const tasksByAssignment = new Map<string, (typeof tasks)[number][]>();
  for (const t of tasks) {
    const key = t.assignmentId.toString();
    if (!tasksByAssignment.has(key)) tasksByAssignment.set(key, []);
    tasksByAssignment.get(key)!.push(t);
  }

  // Derive agenda fields
  let topic = meeting.topic || "";
  let wordOfTheDay = "";
  const warnings: string[] = [];
  const preparedSpeeches: AgendaData["preparedSpeeches"] = [];

  const roles = assignments.map((a) => {
    const user = userMap.get(a.assigneeUserId.toString());
    const aTasks = tasksByAssignment.get(a._id.toString()) || [];

    const dataItems: { label: string; value: string }[] = [];

    for (const t of aTasks) {
      if (t.taskType === "provide-meeting-topic" && t.status === "completed") {
        if (!topic) topic = t.answerText;
        dataItems.push({ label: "Meeting Topic", value: t.answerText });
      }
      if (
        t.taskType === "provide-word-of-the-day" &&
        t.status === "completed"
      ) {
        wordOfTheDay = t.answerText;
        dataItems.push({ label: "Word of the Day", value: t.answerText });
      }
      if (t.taskType === "provide-project-name" && t.status === "completed") {
        dataItems.push({ label: "Project Name", value: t.answerText });
      }
      if (t.taskType === "provide-speech-title" && t.status === "completed") {
        dataItems.push({ label: "Speech Title", value: t.answerText });
      }
    }

    // Collect prepared speeches
    if (a.roleType === "prepared-speaker") {
      const projectTask = aTasks.find(
        (t) => t.taskType === "provide-project-name"
      );
      const titleTask = aTasks.find(
        (t) => t.taskType === "provide-speech-title"
      );
      preparedSpeeches.push({
        speakerName: user?.name ?? "Unknown",
        projectName:
          projectTask?.status === "completed" ? projectTask.answerText : "",
        speechTitle:
          titleTask?.status === "completed" ? titleTask.answerText : "",
      });
    }

    // Warnings
    if (a.confirmationStatus === "pending") {
      warnings.push(`${user?.name ?? "Unknown"} (${a.roleName}) has not confirmed.`);
    }
    if (a.confirmationStatus === "declined") {
      warnings.push(`${user?.name ?? "Unknown"} (${a.roleName}) has declined.`);
    }

    return {
      roleName: a.roleName,
      assigneeName: user?.name ?? "Unknown",
      confirmationStatus: a.confirmationStatus,
      dataItems,
    };
  });

  const agenda: AgendaData = {
    meetingDate: meeting.meetingDate.toISOString(),
    status: meeting.status,
    topic,
    wordOfTheDay,
    roles,
    preparedSpeeches,
    warnings,
  };

  return NextResponse.json({ agenda });
}
