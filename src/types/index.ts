export type SystemRole = "member" | "secretary";

export type MeetingStatus = "draft" | "open" | "finalized";

export type ConfirmationStatus = "pending" | "confirmed" | "declined";

export type TaskStatus = "pending" | "completed";

export type RoleType =
  | "toastmaster"
  | "language-evaluator"
  | "prepared-speaker"
  | "general-evaluator"
  | "individual-evaluator"
  | "table-topic-master"
  | "joke-master"
  | "timer"
  | "ah-counter"
  | "custom";

export type TaskType =
  | "confirm-attendance"
  | "provide-meeting-topic"
  | "provide-word-of-the-day"
  | "provide-project-name"
  | "provide-speech-title";

export interface RoleTemplate {
  roleName: string;
  roleType: RoleType;
  isAgendaRelevant: boolean;
  tasks: { taskType: TaskType; title: string }[];
}
