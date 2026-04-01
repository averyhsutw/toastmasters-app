"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, useCurrentMeeting, useCreateMeeting } from "@/hooks/use-meeting";

function getNextSaturday(): string {
  const d = new Date();
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
  return d.toISOString().split("T")[0];
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: meeting, isLoading: meetingLoading } = useCurrentMeeting();
  const createMeeting = useCreateMeeting();
  const [date, setDate] = useState(getNextSaturday);
  const [showForm, setShowForm] = useState(false);

  const isSecretary = session?.systemRole === "secretary";

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createMeeting.mutateAsync(date);
    setShowForm(false);
    router.push("/meetings/current");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        {isSecretary ? "Secretary view" : "Member view"}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Current Meeting Card */}
        <Link
          href="/meetings/current"
          className="group rounded-lg border border-zinc-200 p-5 transition-colors hover:border-blue-300 hover:bg-blue-50/50 dark:border-zinc-800 dark:hover:border-blue-800 dark:hover:bg-blue-950/20"
        >
          <h2 className="font-semibold group-hover:text-blue-600">
            Current Meeting
          </h2>
          {meetingLoading ? (
            <p className="mt-2 text-sm text-zinc-500">Loading…</p>
          ) : meeting ? (
            <div className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
              <p>
                {new Date(meeting.meetingDate).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  meeting.status === "open"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : meeting.status === "draft"
                      ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                }`}
              >
                {meeting.status}
              </span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">No active meeting</p>
          )}
        </Link>

        {/* My Tasks Card */}
        <Link
          href="/tasks"
          className="group rounded-lg border border-zinc-200 p-5 transition-colors hover:border-green-300 hover:bg-green-50/50 dark:border-zinc-800 dark:hover:border-green-800 dark:hover:bg-green-950/20"
        >
          <h2 className="font-semibold group-hover:text-green-600">
            My Tasks
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            View and complete your assigned tasks
          </p>
        </Link>

        {/* Agenda Card */}
        {meeting && (
          <Link
            href="/meetings/current/agenda"
            className="group rounded-lg border border-zinc-200 p-5 transition-colors hover:border-amber-300 hover:bg-amber-50/50 dark:border-zinc-800 dark:hover:border-amber-800 dark:hover:bg-amber-950/20"
          >
            <h2 className="font-semibold group-hover:text-amber-600">
              Agenda
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              View the meeting agenda
            </p>
          </Link>
        )}
      </div>

      {/* Secretary quick actions */}
      {isSecretary && !meeting && (
        <div className="mt-8 rounded-lg border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
          {showForm ? (
            <form onSubmit={handleCreate} className="mx-auto max-w-xs space-y-4">
              <label className="block text-sm font-medium text-left">
                Meeting Date
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                />
              </label>
              <div className="flex gap-2 justify-center">
                <button
                  type="submit"
                  disabled={createMeeting.isPending}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMeeting.isPending ? "Creating…" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
                >
                  Cancel
                </button>
              </div>
              {createMeeting.isError && (
                <p className="text-sm text-red-600">{createMeeting.error.message}</p>
              )}
            </form>
          ) : (
            <>
              <p className="text-sm text-zinc-500">
                No active meeting. Create one to get started.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Create Meeting
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
