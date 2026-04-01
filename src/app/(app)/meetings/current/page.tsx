"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useCurrentMeeting,
  useMeetingAssignments,
  useSession,
  useMembers,
  useAddAssignment,
  useUpdateMeetingStatus,
  useReassignAssignment,
} from "@/hooks/use-meeting";
import type { AssignmentData, MemberData } from "@/hooks/use-meeting";
import { ROLE_TEMPLATES } from "@/lib/role-templates";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:
      "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    confirmed:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    declined:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? styles.pending}`}
    >
      {status}
    </span>
  );
}

function TaskDataStatus({ tasks }: { tasks: AssignmentData["tasks"] }) {
  if (tasks.length === 0) return <span className="text-xs text-zinc-400">—</span>;

  const completed = tasks.filter((t) => t.status === "completed").length;
  const total = tasks.length;

  if (completed === total) {
    return (
      <span className="text-xs font-medium text-green-600 dark:text-green-400">
        {completed}/{total} done
      </span>
    );
  }

  return (
    <span className="text-xs text-zinc-500">
      {completed}/{total} done
    </span>
  );
}

function ReassignSelect({
  members,
  currentAssigneeId,
  isPending,
  onSelect,
  onCancel,
}: {
  members: MemberData[];
  currentAssigneeId: string | undefined;
  isPending: boolean;
  onSelect: (userId: string) => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <select
        autoFocus
        defaultValue=""
        disabled={isPending}
        onChange={(e) => {
          if (e.target.value) onSelect(e.target.value);
        }}
        className="rounded border border-zinc-300 px-1.5 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
      >
        <option value="" disabled>
          {isPending ? "Saving…" : "Select…"}
        </option>
        {members
          .filter((m) => m.id !== currentAssigneeId)
          .map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
      </select>
      <button
        onClick={onCancel}
        disabled={isPending}
        className="text-xs text-zinc-400 hover:text-zinc-600"
      >
        ✕
      </button>
    </div>
  );
}

export default function CurrentMeetingPage() {
  const { data: session } = useSession();
  const { data: meeting, isLoading: meetingLoading } = useCurrentMeeting();
  const {
    data: assignments,
    isLoading: assignmentsLoading,
  } = useMeetingAssignments(meeting?.id);
  const { data: members } = useMembers();
  const addAssignment = useAddAssignment(meeting?.id);
  const updateStatus = useUpdateMeetingStatus(meeting?.id);
  const reassign = useReassignAssignment(meeting?.id);

  const [showAddRole, setShowAddRole] = useState(false);
  const [roleType, setRoleType] = useState<string>(ROLE_TEMPLATES[0].roleType);
  const [assigneeId, setAssigneeId] = useState("");
  const [reassigningId, setReassigningId] = useState<string | null>(null);

  if (meetingLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-sm text-zinc-500">Loading meeting…</p>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold">Current Meeting</h1>
        <p className="mt-4 text-zinc-500">No active meeting found.</p>
      </div>
    );
  }

  const isSecretary = session?.systemRole === "secretary";
  const isToastmaster =
    meeting.toastmasterAssignmentId &&
    assignments?.some(
      (a) =>
        a.id === meeting.toastmasterAssignmentId &&
        a.assignee?.id === session?.userId
    );
  const canEdit = isSecretary || isToastmaster;

  async function handleAddRole(e: React.FormEvent) {
    e.preventDefault();
    if (!assigneeId) return;
    await addAssignment.mutateAsync({ roleType, assigneeUserId: assigneeId });
    setShowAddRole(false);
    setAssigneeId("");
  }

  const nextStatus = meeting.status === "draft" ? "open" : meeting.status === "open" ? "finalized" : null;
  const statusLabel: Record<string, string> = {
    open: "Open Meeting",
    finalized: "Finalize Meeting",
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Meeting Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Current Meeting</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {new Date(meeting.meetingDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              meeting.status === "open"
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : meeting.status === "draft"
                  ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            }`}
          >
            {meeting.status}
          </span>
          {isSecretary && nextStatus && (
            <button
              onClick={() => updateStatus.mutate(nextStatus)}
              disabled={updateStatus.isPending}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {updateStatus.isPending ? "Updating…" : statusLabel[nextStatus]}
            </button>
          )}
        </div>
      </div>

      {meeting.topic && (
        <p className="mt-3 text-zinc-700 dark:text-zinc-300">
          <span className="font-medium">Topic:</span> {meeting.topic}
        </p>
      )}

      {meeting.status === "finalized" && (
        <Link
          href="/meetings/current/agenda"
          className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          View Agenda →
        </Link>
      )}

      {/* Role Table */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Role Assignments</h2>
          {canEdit && meeting.status !== "finalized" && (
            <button
              onClick={() => setShowAddRole(!showAddRole)}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              {showAddRole ? "Cancel" : "+ Add Role"}
            </button>
          )}
        </div>

        {/* Add Role Form */}
        {showAddRole && canEdit && (
          <form
            onSubmit={handleAddRole}
            className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <label className="flex-1 min-w-[160px]">
              <span className="block text-xs font-medium text-zinc-500 mb-1">Role</span>
              <select
                value={roleType}
                onChange={(e) => setRoleType(e.target.value)}
                className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              >
                {ROLE_TEMPLATES.map((t) => (
                  <option key={t.roleType} value={t.roleType}>
                    {t.roleName}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex-1 min-w-[160px]">
              <span className="block text-xs font-medium text-zinc-500 mb-1">Assign To</span>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                required
                className="block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              >
                <option value="">Select member…</option>
                {members?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={addAssignment.isPending}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {addAssignment.isPending ? "Adding…" : "Add"}
            </button>
            {addAssignment.isError && (
              <p className="w-full text-sm text-red-600">{addAssignment.error.message}</p>
            )}
          </form>
        )}

        {assignmentsLoading ? (
          <p className="mt-4 text-sm text-zinc-500">Loading assignments…</p>
        ) : !assignments || assignments.length === 0 ? (
          <p className="mt-4 text-zinc-500">No roles assigned yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                  <th className="pb-3 pr-4 font-medium text-zinc-500">Role</th>
                  <th className="pb-3 pr-4 font-medium text-zinc-500">
                    Assignee
                  </th>
                  <th className="pb-3 pr-4 font-medium text-zinc-500">
                    Confirmation
                  </th>
                  <th className="pb-3 pr-4 font-medium text-zinc-500">
                    Data Status
                  </th>
                  {canEdit && (
                    <th className="pb-3 font-medium text-zinc-500">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {assignments.map((a) => (
                  <tr key={a.id}>
                    <td className="py-3 pr-4 font-medium">{a.roleName}</td>
                    <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">
                      {a.assignee?.name ?? "Unassigned"}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={a.confirmationStatus} />
                    </td>
                    <td className="py-3 pr-4">
                      <TaskDataStatus tasks={a.tasks} />
                    </td>
                    {canEdit && (
                      <td className="py-3">
                        {reassigningId === a.id ? (
                          <ReassignSelect
                            members={members ?? []}
                            currentAssigneeId={a.assignee?.id}
                            isPending={reassign.isPending}
                            onSelect={async (userId) => {
                              await reassign.mutateAsync({
                                assignmentId: a.id,
                                assigneeUserId: userId,
                              });
                              setReassigningId(null);
                            }}
                            onCancel={() => setReassigningId(null)}
                          />
                        ) : (
                          <button
                            onClick={() => setReassigningId(a.id)}
                            disabled={meeting.status === "finalized"}
                            className="text-xs text-blue-600 hover:text-blue-800 disabled:text-zinc-400 dark:text-blue-400"
                          >
                            Reassign
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
