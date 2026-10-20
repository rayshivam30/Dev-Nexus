import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/api-utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN" || !currentUser.orgId) redirect("/auth/login");

  const entries = await prisma.auditLog.findMany({
    where: { user: { orgId: currentUser.orgId } },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Audit log</h1>
        <p className="mt-1 text-sm text-zinc-400">Recent security and administrative events for your organization.</p>
      </header>
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-zinc-500">
            <tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Resource</th><th className="px-4 py-3">Result</th><th className="px-4 py-3">IP address</th></tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06] text-zinc-300">
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className="whitespace-nowrap px-4 py-3 text-zinc-400">{entry.createdAt.toLocaleString()}</td>
                <td className="px-4 py-3">{entry.user?.name || entry.user?.email || "Former user"}</td>
                <td className="px-4 py-3 font-medium text-white">{entry.action}</td>
                <td className="px-4 py-3">{entry.resource}{entry.resourceId ? ` · ${entry.resourceId}` : ""}</td>
                <td className={`px-4 py-3 ${entry.success ? "text-emerald-400" : "text-rose-400"}`}>{entry.success ? "Success" : "Failure"}</td>
                <td className="px-4 py-3 text-zinc-400">{entry.ipAddress || "—"}</td>
              </tr>
            ))}
            {entries.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-zinc-500">No audit events recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-500">Showing the latest 100 events.</p>
    </section>
  );
}
