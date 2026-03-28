import type { RoleTemplate } from "@/types";

export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    roleName: "Toastmaster",
    roleType: "toastmaster",
    isAgendaRelevant: true,
    tasks: [
      { taskType: "confirm-attendance", title: "Confirm Attendance" },
      { taskType: "provide-meeting-topic", title: "Provide Meeting Topic" },
    ],
  },
  {
    roleName: "Language Evaluator",
    roleType: "language-evaluator",
    isAgendaRelevant: true,
    tasks: [
      { taskType: "confirm-attendance", title: "Confirm Attendance" },
      {
        taskType: "provide-word-of-the-day",
        title: "Provide Word of the Day",
      },
    ],
  },
  {
    roleName: "Prepared Speaker",
    roleType: "prepared-speaker",
    isAgendaRelevant: true,
    tasks: [
      { taskType: "confirm-attendance", title: "Confirm Attendance" },
      { taskType: "provide-project-name", title: "Provide Project Name" },
      { taskType: "provide-speech-title", title: "Provide Speech Title" },
    ],
  },
  {
    roleName: "General Evaluator",
    roleType: "general-evaluator",
    isAgendaRelevant: false,
    tasks: [
      { taskType: "confirm-attendance", title: "Confirm Attendance" },
    ],
  },
  {
    roleName: "Individual Evaluator",
    roleType: "individual-evaluator",
    isAgendaRelevant: false,
    tasks: [
      { taskType: "confirm-attendance", title: "Confirm Attendance" },
    ],
  },
  {
    roleName: "Table Topic Master",
    roleType: "table-topic-master",
    isAgendaRelevant: false,
    tasks: [
      { taskType: "confirm-attendance", title: "Confirm Attendance" },
    ],
  },
  {
    roleName: "Joke Master",
    roleType: "joke-master",
    isAgendaRelevant: false,
    tasks: [
      { taskType: "confirm-attendance", title: "Confirm Attendance" },
    ],
  },
  {
    roleName: "Timer",
    roleType: "timer",
    isAgendaRelevant: false,
    tasks: [
      { taskType: "confirm-attendance", title: "Confirm Attendance" },
    ],
  },
];
