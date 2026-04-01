import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Assignment } from "@/models/assignment";
import { Task } from "@/models/task";
import { User } from "@/models/user";
import { Meeting } from "@/models/meeting";
import { ROLE_TEMPLATES } from "@/lib/role-templates";

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

  const assignments = await Assignment.find({ meetingId })
    .sort({ sortOrder: 1 })
    .lean();

  // Batch-fetch related users and tasks
  const userIds = [...new Set(assignments.map((a) => a.assigneeUserId.toString()))];
  const [users, tasks] = await Promise.all([
    User.find({ _id: { $in: userIds } })
      .select("name email")
      .lean(),
    Task.find({ meetingId }).lean(),
  ]);

  const userMap = new Map(users.map((u) => [u._id.toString(), u]));
  const tasksByAssignment = new Map<string, typeof tasks>();
  for (const t of tasks) {
    const key = t.assignmentId.toString();
    if (!tasksByAssignment.has(key)) tasksByAssignment.set(key, []);
    tasksByAssignment.get(key)!.push(t);
  }

  const result = assignments.map((a) => {
    const assignee = userMap.get(a.assigneeUserId.toString());
    const assignmentTasks = tasksByAssignment.get(a._id.toString()) || [];

    return {
      id: a._id.toString(),
      roleName: a.roleName,
      roleType: a.roleType,
      confirmationStatus: a.confirmationStatus,
      isAgendaRelevant: a.isAgendaRelevant,
      sortOrder: a.sortOrder,
      assignee: assignee
        ? { id: assignee._id.toString(), name: assignee.name, email: assignee.email }
        : null,
      tasks: assignmentTasks.map((t) => ({
        id: t._id.toString(),
        taskType: t.taskType,
        title: t.title,
        status: t.status,
        answerText: t.answerText,
      })),
    };
  });

  return NextResponse.json({ assignments: result });
}

export async function POST(
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

  const { id: meetingId } = await params;
  const { roleType, assigneeUserId, roleName: customRoleName } = await request.json();

  if (!roleType || !assigneeUserId) {
    return NextResponse.json(
      { error: "roleType and assigneeUserId are required" },
      { status: 400 }
    );
  }

  await connectDB();

  // Verify meeting exists and is draft/open
  const meeting = await Meeting.findById(meetingId);
  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }
  if (meeting.status === "finalized") {
    return NextResponse.json(
      { error: "Cannot add roles to a finalized meeting" },
      { status: 422 }
    );
  }

  // Verify user exists
  const user = await User.findById(assigneeUserId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Find template for this role type
  const template = ROLE_TEMPLATES.find((t) => t.roleType === roleType);
  const roleName = customRoleName || template?.roleName || roleType;
  const isAgendaRelevant = template?.isAgendaRelevant ?? false;

  // Determine sort order (append at end)
  const maxSort = await Assignment.findOne({ meetingId })
    .sort({ sortOrder: -1 })
    .select("sortOrder")
    .lean();
  const sortOrder = (maxSort?.sortOrder ?? -1) + 1;

  // Create assignment
  const assignment = await Assignment.create({
    meetingId,
    roleName,
    roleType,
    assigneeUserId,
    confirmationStatus: "pending",
    isAgendaRelevant,
    sortOrder,
  });

  // If this is the toastmaster role and meeting doesn't have one yet, link it
  if (roleType === "toastmaster" && !meeting.toastmasterAssignmentId) {
    meeting.toastmasterAssignmentId = assignment._id;
    await meeting.save();
  }

  // Auto-generate tasks from template
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

  return NextResponse.json(
    {
      assignment: {
        id: assignment._id.toString(),
        roleName: assignment.roleName,
        roleType: assignment.roleType,
        confirmationStatus: assignment.confirmationStatus,
        isAgendaRelevant: assignment.isAgendaRelevant,
        sortOrder: assignment.sortOrder,
        assignee: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
      },
    },
    { status: 201 }
  );
}
