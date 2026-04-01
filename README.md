# Toastmasters Club Management Website

A full-stack web app for managing weekly Toastmasters club meetings — from role assignment to agenda delivery.

## Why This Exists

Running a Toastmasters meeting involves a lot of coordination: the secretary assigns roles to members each week, members need to confirm attendance and submit their prepared content (speech titles, topics, word of the day), and the agenda has to be compiled and sent before the meeting. Doing this over email or spreadsheets is slow and error-prone.

This app centralizes the entire workflow in one place.

## Core Workflow

1. **Secretary creates the meeting** and assigns roles (e.g. Toastmaster, Timer, Table Topics Master, speakers).
2. **Members log in**, confirm their role, and fill in any required details (speech info, topic, word of the day).
3. **The agenda updates automatically** based on what members submit.
4. **Secretary reviews the role table** and sends the agenda email when everyone is confirmed.
5. **Roles can be reassigned** at any time by the secretary or the meeting's Toastmaster.

## Feature Highlights

- **Role table** — live view of who is doing what this week, with confirmation status per member
- **My Tasks** — each member sees only their own tasks and can confirm or submit details from one page
- **Auto-generated agenda** — agenda content is derived from task submissions, not manual entry
- **Role reassignment** — secretary or Toastmaster can swap a role; the system regenerates tasks automatically
- **Agenda email** — secretary can send the finalized agenda to all members in one click
- **Permission-based UI** — secretary sees management controls; members see only their own tasks

## Roles

| Role | Permissions |
|---|---|
| Secretary | Create meetings, assign/reassign roles, send agenda email |
| Toastmaster (assigned) | Reassign roles for the current meeting |
| Member | View role table, complete own tasks |

## Getting Started

### Prerequisites

- Node.js 22+
- MongoDB (local or Atlas)

### Setup

```bash
npm install
```

Create a `.env.local` file:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Seed demo data (8 users: 1 secretary + 7 members):

```bash
npm run seed
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with:

- **Secretary:** `secretary@demo.com` / `password123`
- **Member:** `member1@demo.com` / `password123` (through `member7@demo.com`)

## Tech Stack

- **Next.js** (App Router) + TypeScript
- **MongoDB** + Mongoose
- **TanStack Query** for client-side data fetching
- **Tailwind CSS**
- Deployed on **Vercel**
