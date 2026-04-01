"use client";

import { useState } from "react";
import { useMyTasks, useUpdateTask } from "@/hooks/use-meeting";
import type { TaskData } from "@/hooks/use-meeting";

function TaskCard({ task }: { task: TaskData }) {
  const updateTask = useUpdateTask();
  const [text, setText] = useState(task.answerText);
  const isConfirmTask = task.taskType === "confirm-attendance";
  const isCompleted = task.status === "completed";

  async function handleConfirm() {
    await updateTask.mutateAsync({
      taskId: task.id,
      answerText: "confirmed",
      status: "completed",
    });
  }

  async function handleDecline() {
    await updateTask.mutateAsync({
      taskId: task.id,
      answerText: "declined",
      status: "completed",
    });
  }

  async function handleSubmitText(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    await updateTask.mutateAsync({
      taskId: task.id,
      answerText: text.trim(),
      status: "completed",
    });
  }

  const isPending = updateTask.isPending;

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{task.title}</p>
          <p className="text-xs text-zinc-500">{task.roleName}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            isCompleted
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          {isCompleted ? "completed" : "pending"}
        </span>
      </div>

      {/* Confirm Attendance task */}
      {isConfirmTask && !isCompleted && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            Confirm
          </button>
          <button
            onClick={handleDecline}
            disabled={isPending}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      )}

      {isConfirmTask && isCompleted && (
        <p className="mt-2 text-sm">
          {task.answerText === "declined" ? (
            <span className="text-red-600 dark:text-red-400">Declined</span>
          ) : (
            <span className="text-green-600 dark:text-green-400">Confirmed</span>
          )}
        </p>
      )}

      {/* Text-based tasks */}
      {!isConfirmTask && !isCompleted && (
        <form onSubmit={handleSubmitText} className="mt-3 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholderFor(task.taskType)}
            required
            className="flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          <button
            type="submit"
            disabled={isPending || !text.trim()}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Save
          </button>
        </form>
      )}

      {!isConfirmTask && isCompleted && (
        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
          {task.answerText}
        </p>
      )}
    </div>
  );
}

function placeholderFor(taskType: string): string {
  switch (taskType) {
    case "provide-meeting-topic":
      return "Enter the meeting topic…";
    case "provide-word-of-the-day":
      return "Enter the word of the day…";
    case "provide-project-name":
      return "Enter your project name…";
    case "provide-speech-title":
      return "Enter your speech title…";
    default:
      return "Enter your answer…";
  }
}

export default function TasksPage() {
  const { data: tasks, isLoading } = useMyTasks();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-zinc-500">Loading tasks…</p>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <p className="mt-4 text-zinc-500">No tasks assigned to you yet.</p>
      </div>
    );
  }

  // Group tasks by meeting
  const byMeeting = new Map<string, TaskData[]>();
  for (const t of tasks) {
    const key = t.meetingId;
    if (!byMeeting.has(key)) byMeeting.set(key, []);
    byMeeting.get(key)!.push(t);
  }

  const pendingCount = tasks.filter((t) => t.status === "pending").length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        {pendingCount > 0 && (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            {pendingCount} pending
          </span>
        )}
      </div>

      <div className="mt-6 space-y-8">
        {[...byMeeting.entries()].map(([meetingId, meetingTasks]) => {
          const first = meetingTasks[0];
          return (
            <section key={meetingId}>
              <h2 className="text-sm font-semibold text-zinc-500">
                {first.meetingDate
                  ? new Date(first.meetingDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })
                  : "Meeting"}
                {first.meetingStatus && (
                  <span className="ml-2 text-xs font-normal text-zinc-400">
                    ({first.meetingStatus})
                  </span>
                )}
              </h2>
              <div className="mt-3 space-y-3">
                {meetingTasks.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
