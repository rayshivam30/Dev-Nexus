import { prisma } from "@/lib/db";

export type NotificationType = 'INCIDENT_CREATED' | 'ASSIGNMENT' | 'COMMENT' | 'SLA' | 'GITHUB_CONFLICT';
type StaffRole = 'ADMIN' | 'MANAGER';

export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  return await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
    }
  });
}

/**
 * Creates notifications for all admins and managers in an organization.
 */
export async function notifyOrgStaff(orgId: string, data: {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  linkByRole?: Partial<Record<StaffRole, string>>;
}) {
  const staff = await prisma.user.findMany({
    where: {
      orgId,
      role: { in: ['ADMIN', 'MANAGER'] }
    },
    select: { id: true, role: true }
  });

  const notifications = staff.map(user => ({
    userId: user.id,
    type: data.type,
    title: data.title,
    message: data.message,
    link: data.linkByRole?.[user.role as StaffRole] || data.link,
  }));

  return await prisma.notification.createMany({
    data: notifications
  });
}

export async function getNotifications(userId: string) {
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
}

export async function getUnreadNotificationCount(userId: string) {
  return await prisma.notification.count({
    where: { userId, isRead: false }
  });
}

export async function markAsRead(notificationId: string, userId: string) {
  return await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true }
  });
}

export async function markAllAsRead(userId: string) {
  return await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true }
  });
}
