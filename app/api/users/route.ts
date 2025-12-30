import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      isAdmin: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { userId, isAdmin } = body;

  if (!userId || typeof isAdmin !== "boolean") {
    return NextResponse.json(
      { error: "User ID and isAdmin status are required" },
      { status: 400 }
    );
  }

  // Prevent admins from demoting themselves
  if (userId === session.user.id) {
    return NextResponse.json(
      { error: "You cannot change your own admin status" },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isAdmin },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      isAdmin: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user });
}
