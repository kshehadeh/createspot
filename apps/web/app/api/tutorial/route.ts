import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TutorialManager } from "@/lib/tutorial-manager";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { page, hintKey, order } = await request.json();

    if (!page || !hintKey) {
      return NextResponse.json(
        { error: "Missing required fields: page, hintKey" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tutorial: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const tutorialManager = new TutorialManager(user.tutorial);
    tutorialManager.markHintSeen(page, hintKey, order ?? 0);

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { tutorial: tutorialManager.toJSON() as any },
      select: { tutorial: true },
    });

    return NextResponse.json({
      success: true,
      tutorial: updatedUser.tutorial,
    });
  } catch (error) {
    console.error("[Tutorial API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action } = await request.json();

    if (!action || !["enable", "disable", "reset"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'enable', 'disable', or 'reset'" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tutorial: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const tutorialManager = new TutorialManager(user.tutorial);

    switch (action) {
      case "enable":
        tutorialManager.enable();
        break;
      case "disable":
        tutorialManager.disable();
        break;
      case "reset":
        tutorialManager.reset();
        break;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { tutorial: tutorialManager.toJSON() as any },
      select: { tutorial: true },
    });

    return NextResponse.json({
      success: true,
      tutorial: updatedUser.tutorial,
    });
  } catch (error) {
    console.error("[Tutorial API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
