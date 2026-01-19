import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNotificationMetadata } from "@/lib/notifications/metadata";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const userId = searchParams.get("userId");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  // Build where clause
  const where: {
    type?: string;
    userId?: string;
  } = {};

  if (type) {
    where.type = type;
  }

  if (userId) {
    where.userId = userId;
  }

  // Get total count
  const total = await prisma.notificationLog.count({ where });

  // Get paginated notifications
  const notifications = await prisma.notificationLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { sentAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  // Format metadata for each notification
  const notificationsWithMetadata = await Promise.all(
    notifications.map(async (notification) => {
      const metadataDescription = await formatNotificationMetadata(
        notification.type,
        notification.meta as Record<string, unknown>,
      );

      return {
        id: notification.id,
        type: notification.type,
        sentAt: notification.sentAt,
        userId: notification.userId,
        user: notification.user
          ? {
              id: notification.user.id,
              name: notification.user.name,
              email: notification.user.email,
            }
          : null,
        metadata: metadataDescription,
        meta: notification.meta,
      };
    }),
  );

  const totalPages = Math.ceil(total / pageSize);

  return NextResponse.json({
    notifications: notificationsWithMetadata,
    total,
    page,
    pageSize,
    totalPages,
  });
}
