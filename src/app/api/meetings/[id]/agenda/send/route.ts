import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Meeting } from "@/models/meeting";
import { Assignment } from "@/models/assignment";
import { Task } from "@/models/task";
import { User } from "@/models/user";
import { Resend } from "resend";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.systemRole !== "secretary") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Email service not configured (RESEND_API_KEY missing)" },
      { status: 503 }
    );
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

  // Build agenda text
  const dateStr = new Date(meeting.meetingDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const topic = meeting.topic || "TBD";

  // Find word of the day
  let wordOfTheDay = "TBD";
  for (const t of tasks) {
    if (
      t.taskType === "provide-word-of-the-day" &&
      t.status === "completed" &&
      t.answerText
    ) {
      wordOfTheDay = t.answerText;
      break;
    }
  }

  // Build role list
  const roleLines = assignments.map((a) => {
    const user = userMap.get(a.assigneeUserId.toString());
    return `  ${a.roleName}: ${user?.name ?? "TBD"}`;
  });

  // Build speeches
  const speechLines: string[] = [];
  for (const a of assignments) {
    if (a.roleType !== "prepared-speaker") continue;
    const user = userMap.get(a.assigneeUserId.toString());
    const aTasks = tasksByAssignment.get(a._id.toString()) || [];
    const proj = aTasks.find((t) => t.taskType === "provide-project-name");
    const title = aTasks.find((t) => t.taskType === "provide-speech-title");
    speechLines.push(
      `  ${user?.name ?? "TBD"} — ${proj?.answerText || "TBD"}: "${title?.answerText || "TBD"}"`
    );
  }

  const body = [
    `Toastmasters Meeting Agenda`,
    `Date: ${dateStr}`,
    `Topic: ${topic}`,
    `Word of the Day: ${wordOfTheDay}`,
    ``,
    `Role Assignments:`,
    ...roleLines,
    ...(speechLines.length > 0
      ? [``, `Prepared Speeches:`, ...speechLines]
      : []),
    ``,
    `See you there!`,
  ].join("\n");

  const recipientEmails = users
    .map((u) => u.email)
    .filter((e): e is string => !!e);

  const fromAddress =
    process.env.RESEND_FROM_EMAIL || "Toastmasters <onboarding@resend.dev>";

  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({
      from: fromAddress,
      to: recipientEmails,
      subject: `Meeting Agenda — ${dateStr}`,
      text: body,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 502 }
    );
  }

  return NextResponse.json({
    message: "Agenda email sent",
    recipientCount: recipientEmails.length,
  });
}
