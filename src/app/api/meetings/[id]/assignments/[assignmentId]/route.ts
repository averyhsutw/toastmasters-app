import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Assignment } from "@/models/assignment";
import { Task } from "@/models/task";
import { User } from "@/models/user";
import { Meeting } from "@/models/meeting";
import { ROLE_TEMPLATES } from "@/lib/role-templates";

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: meetingId, assignmentId } = await params;
  const { assigneeUserId } = await request.json();

  if (!assigneeUserId) {
    return NextResponse.json(
      { error: "assigneeUserId is required" },
      { status: 400 }
    );
  }

  await connectDB();

  // Verify meeting exists and is not finalized
  const meeting = await Meeting.findById(meetingId);
  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }
  if (meeting.status === "finalized") {
    return NextResponse.json(
      { error: "Cannot reassign roles in a finalized meeting" },
      { status: 422 }
    );
  }

  // Permission: secretary or the current Toastmaster for this meeting
  const isSecretary = session.systemRole === "secretary";
  const isToastmaster =
    meeting.toastmasterAssignmentId &&
    (await Assignment.exists({
      _id: meeting.toastmasterAssignmentId,
      assigneeUserId: session.userId,
    }));

  if (!isSecretary && !isToastmaster) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assignment = await Assignment.findOne({
    _id: assignmentId,
    meetingId,
  });
  if (!assignment) {
    return NextResponse.json(
      { error: "Assignment not found" },
      { status: 404 }
    );
  }

  // Verify new user exists
  const newUser = await User.findById(assigneeUserId);
  if (!newUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Delete old tasks for this assignment
  await Task.deleteMany({ assignmentId: assignment._id });

  // Update assignment
  assignment.assigneeUserId = assigneeUserId;
  assignment.confirmationStatus = "pending";
  await assignment.save();

  // Regenerate tasks from template
  const template = ROLE_TEMPLATES.find(
    (t) => t.roleType === assignment.roleType
  );
  const taskDefs = template?.tasks ?? [];
  if (taskDefs.length > 0) {
    await Task.insertMany(
      taskDefs.map((td) => ({
        meetingId,
        assignmentId: assignment._id,
        assigneeUserId,
        taskType: td.taskType,
        title: td.title,
        status: "pending",
        answerText: "",
      }))
    );
  }

  // If this was the toastmaster assignment and the topic came from old assignee, clear it
  if (assignment.roleType === "toastmaster" && meeting.topic) {
    meeting.topic = "";
    await meeting.save();
  }

  return NextResponse.json({
    assignment: {
      id: assignment._id.toString(),
      roleName: assignment.roleName,
      roleType: assignment.roleType,
      confirmationStatus: assignment.confirmationStatus,
      assignee: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
      },
    },
  });
}
