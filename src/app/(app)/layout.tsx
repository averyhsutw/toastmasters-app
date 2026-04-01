import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { User } from "@/models/user";
import NavBar from "@/components/nav-bar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  // Fetch user name for display
  await connectDB();
  const user = await User.findById(session.userId).select("name").lean();
  const displayName = user?.name ?? session.email;

  return (
    <div className="flex min-h-full flex-col">
      <NavBar userName={displayName} systemRole={session.systemRole} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
