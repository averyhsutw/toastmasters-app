import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Task } from "@/models/task";
import { Assignment } from "@/models/assignment";
import { Meeting } from "@/models/meeting";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { answerText, status } = await request.json();

  await connectDB();

  const task = await Task.findById(id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Only the assignee can update their own task
  if (task.assigneeUserId.toString() !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check meeting is not finalized
  const meeting = await Meeting.findById(task.meetingId);
  if (meeting?.status === "finalized") {
    return NextResponse.json(
      { error: "Cannot update tasks for a finalized meeting" },
      { status: 422 }
    );
  }

  // Update task fields
  if (answerText !== undefined) task.answerText = answerText;
  if (status !== undefined) task.status = status;
  await task.save();

  // If this is a confirm-attendance task, sync to assignment confirmationStatus
  if (task.taskType === "confirm-attendance") {
    const newConfirmation =
      task.status === "completed"
        ? task.answerText === "declined"
          ? "declined"
          : "confirmed"
        : "pending";

    await Assignment.findByIdAndUpdate(task.assignmentId, {
      confirmationStatus: newConfirmation,
    });
  }

  // If this is a provide-meeting-topic task and completed, sync to meeting.topic
  if (
    task.taskType === "provide-meeting-topic" &&
    task.status === "completed" &&
    task.answerText
  ) {
    await Meeting.findByIdAndUpdate(task.meetingId, {
      topic: task.answerText,
    });
  }

  return NextResponse.json({
    task: {
      id: task._id.toString(),
      taskType: task.taskType,
      title: task.title,
      status: task.status,
      answerText: task.answerText,
      meetingId: task.meetingId.toString(),
      assignmentId: task.assignmentId.toString(),
    },
  });
}
