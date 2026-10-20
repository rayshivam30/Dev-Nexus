import { prisma } from "@/lib/db";
import { createNotification } from "@/services/notification-service";
import { sendMail } from "@/lib/mailer";

export async function notifyCurrentOnCall(projectId: string, data: { title: string; message: string; link: string }) {
  const rotation = await prisma.onCallRotation.findUnique({
    where: { projectId },
    include: { members: { orderBy: { position: "asc" }, include: { user: { select: { id: true, email: true, status: true } } } } },
  });
  if (!rotation?.enabled || rotation.members.length === 0) return null;

  const now = Date.now();
  const start = rotation.startsAt.getTime();
  if (now < start) return null;
  const shiftMs = rotation.shiftDurationHours * 60 * 60_000;
  const shiftIndex = Math.floor((now - start) / shiftMs) % rotation.members.length;
  const member = rotation.members[shiftIndex]?.user;
  if (!member || member.status !== "ACTIVE") return null;

  const nextChange = new Date(start + (Math.floor((now - start) / shiftMs) + 1) * shiftMs);
  await createNotification({ userId: member.id, type: "ALERT_POLICY", title: data.title, message: `${data.message} You are on call until ${new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: rotation.timezone }).format(nextChange)} (${rotation.timezone}).`, link: data.link });
  const safeTitle = data.title.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char]!);
  const safeMessage = data.message.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char]!);
  await sendMail({ to: member.email, subject: data.title, html: `<p>${safeTitle}</p><p>${safeMessage}</p><p><a href="${data.link}">View incident</a></p>` });
  return { userId: member.id, email: member.email, nextChange };
}
