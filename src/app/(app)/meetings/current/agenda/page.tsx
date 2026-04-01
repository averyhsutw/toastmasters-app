"use client";

import { useState } from "react";
import {
  useCurrentMeeting,
  useAgenda,
  useSendAgenda,
  useSession,
} from "@/hooks/use-meeting";

export default function AgendaPage() {
  const { data: session } = useSession();
  const { data: meeting, isLoading: meetingLoading } = useCurrentMeeting();
  const { data: agenda, isLoading: agendaLoading } = useAgenda(meeting?.id);
  const sendAgenda = useSendAgenda(meeting?.id);
  const [sent, setSent] = useState(false);

  const isSecretary = session?.systemRole === "secretary";

  if (meetingLoading || agendaLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-zinc-500">Loading agenda…</p>
      </div>
    );
  }

  if (!meeting || !agenda) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">Meeting Agenda</h1>
        <p className="mt-4 text-zinc-500">No active meeting found.</p>
      </div>
    );
  }

  async function handleSend() {
    if (!confirm("Send agenda email to all members?")) return;
    await sendAgenda.mutateAsync();
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meeting Agenda</h1>
        {isSecretary && (
          <button
            onClick={handleSend}
            disabled={sendAgenda.isPending || sent}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {sent
              ? "Sent!"
              : sendAgenda.isPending
                ? "Sending…"
                : "Send Agenda Email"}
          </button>
        )}
      </div>

      {sendAgenda.isError && (
        <p className="mt-2 text-sm text-red-600">{sendAgenda.error.message}</p>
      )}

      {/* Warnings */}
      {agenda.warnings.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Attention
          </p>
          <ul className="mt-1 space-y-1 text-sm text-amber-700 dark:text-amber-400">
            {agenda.warnings.map((w, i) => (
              <li key={i}>• {w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Agenda Card */}
      <div className="mt-6 space-y-6 rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        {/* Date & Status */}
        <div>
          <p className="text-lg font-semibold">
            {new Date(agenda.meetingDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              agenda.status === "finalized"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            }`}
          >
            {agenda.status}
          </span>
        </div>

        {/* Topic */}
        <Section label="Meeting Topic">
          <p className={agenda.topic ? "" : "text-zinc-400 italic"}>
            {agenda.topic || "Not yet provided"}
          </p>
        </Section>

        {/* Word of the Day */}
        <Section label="Word of the Day">
          <p className={agenda.wordOfTheDay ? "" : "text-zinc-400 italic"}>
            {agenda.wordOfTheDay || "Not yet provided"}
          </p>
        </Section>

        {/* Role Assignments */}
        <Section label="Role Assignments">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                  <th className="pb-2 pr-4 font-medium text-zinc-500">Role</th>
                  <th className="pb-2 pr-4 font-medium text-zinc-500">
                    Assignee
                  </th>
                  <th className="pb-2 font-medium text-zinc-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {agenda.roles.map((r, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-4 font-medium">{r.roleName}</td>
                    <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">
                      {r.assigneeName}
                    </td>
                    <td className="py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.confirmationStatus === "confirmed"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : r.confirmationStatus === "declined"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {r.confirmationStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Prepared Speeches */}
        {agenda.preparedSpeeches.length > 0 && (
          <Section label="Prepared Speeches">
            <div className="space-y-3">
              {agenda.preparedSpeeches.map((s, i) => (
                <div
                  key={i}
                  className="rounded-md border border-zinc-100 p-3 dark:border-zinc-800"
                >
                  <p className="font-medium">{s.speakerName}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Project: {s.projectName || <Placeholder />}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Title: {s.speechTitle || <Placeholder />}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </h2>
      {children}
    </div>
  );
}

function Placeholder() {
  return <span className="italic text-zinc-400">Not yet provided</span>;
}
