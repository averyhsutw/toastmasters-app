"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface MeetingData {
  id: string;
  meetingDate: string;
  status: "draft" | "open" | "finalized";
  topic: string;
  toastmasterAssignmentId: string | null;
  createdByUserId: string;
}

export interface SessionUser {
  userId: string;
  email: string;
  systemRole: string;
}

export interface MemberData {
  id: string;
  name: string;
  email: string;
  systemRole: string;
}

export interface AssignmentData {
  id: string;
  roleName: string;
  roleType: string;
  confirmationStatus: "pending" | "confirmed" | "declined";
  isAgendaRelevant: boolean;
  sortOrder: number;
  assignee: { id: string; name: string; email: string } | null;
  tasks: {
    id: string;
    taskType: string;
    title: string;
    status: "pending" | "completed";
    answerText: string;
  }[];
}

export function useSession() {
  return useQuery<SessionUser | null>({
    queryKey: ["session"],
    queryFn: async () => {
      const res = await fetch("/api/auth/session");
      if (!res.ok) return null;
      const data = await res.json();
      return data.user;
    },
  });
}

export function useCurrentMeeting() {
  return useQuery<MeetingData | null>({
    queryKey: ["meetings", "current"],
    queryFn: async () => {
      const res = await fetch("/api/meetings/current");
      if (!res.ok) throw new Error("Failed to fetch current meeting");
      const data = await res.json();
      return data.meeting;
    },
  });
}

export function useMembers() {
  return useQuery<MemberData[]>({
    queryKey: ["members"],
    queryFn: async () => {
      const res = await fetch("/api/members");
      if (!res.ok) throw new Error("Failed to fetch members");
      const data = await res.json();
      return data.members;
    },
  });
}

export function useMeetingAssignments(meetingId: string | undefined) {
  return useQuery<AssignmentData[]>({
    queryKey: ["meetings", meetingId, "assignments"],
    queryFn: async () => {
      const res = await fetch(`/api/meetings/${meetingId}/assignments`);
      if (!res.ok) throw new Error("Failed to fetch assignments");
      const data = await res.json();
      return data.assignments;
    },
    enabled: !!meetingId,
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (meetingDate: string) => {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingDate }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create meeting");
      }
      return (await res.json()).meeting as MeetingData;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}

export function useAddAssignment(meetingId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      roleType: string;
      assigneeUserId: string;
      roleName?: string;
    }) => {
      const res = await fetch(`/api/meetings/${meetingId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add assignment");
      }
      return (await res.json()).assignment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings", meetingId, "assignments"] });
    },
  });
}

export function useUpdateMeetingStatus(meetingId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update meeting status");
      }
      return (await res.json()).meeting as MeetingData;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}

// ── Task types & hooks ──

export interface TaskData {
  id: string;
  taskType: string;
  title: string;
  status: "pending" | "completed";
  answerText: string;
  meetingId: string;
  assignmentId: string;
  meetingDate: string | null;
  meetingStatus: string | null;
  roleName: string | null;
}

export function useMyTasks() {
  return useQuery<TaskData[]>({
    queryKey: ["tasks", "me"],
    queryFn: async () => {
      const res = await fetch("/api/tasks/me");
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      return data.tasks;
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      answerText,
      status,
    }: {
      taskId: string;
      answerText?: string;
      status?: string;
    }) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answerText, status }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update task");
      }
      return (await res.json()).task;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", "me"] });
      qc.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}

export function useReassignAssignment(meetingId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      assignmentId,
      assigneeUserId,
    }: {
      assignmentId: string;
      assigneeUserId: string;
    }) => {
      const res = await fetch(
        `/api/meetings/${meetingId}/assignments/${assignmentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assigneeUserId }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to reassign");
      }
      return (await res.json()).assignment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings", meetingId, "assignments"] });
      qc.invalidateQueries({ queryKey: ["meetings", "current"] });
      qc.invalidateQueries({ queryKey: ["tasks", "me"] });
    },
  });
}

// ── Agenda types & hooks ──

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

export function useAgenda(meetingId: string | undefined) {
  return useQuery<AgendaData>({
    queryKey: ["meetings", meetingId, "agenda"],
    queryFn: async () => {
      const res = await fetch(`/api/meetings/${meetingId}/agenda`);
      if (!res.ok) throw new Error("Failed to fetch agenda");
      return (await res.json()).agenda;
    },
    enabled: !!meetingId,
  });
}

export function useSendAgenda(meetingId: string | undefined) {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/meetings/${meetingId}/agenda/send`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send agenda");
      }
      return res.json();
    },
  });
}
