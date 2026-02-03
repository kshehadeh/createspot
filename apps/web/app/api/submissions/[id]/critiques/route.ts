import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type * as runtime from "@prisma/client/runtime/client";
import { sendCritiqueNotification } from "@/app/workflows/send-critique-notification";
import { uploadFragment } from "@/lib/r2-fragments";
import { Prisma } from "@/app/generated/prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const submission = await prisma.submission.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      critiquesEnabled: true,
    },
  });

  if (!submission) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 },
    );
  }

  const isCreator = session.user.id === submission.userId;

  // If user is creator, return all critiques with critiquer info
  // If user is critiquer, return only their critiques
  const critiques = await prisma.critique.findMany({
    where: {
      submissionId: id,
      ...(isCreator ? {} : { critiquerId: session.user.id }),
    },
    include: {
      critiquer: {
        select: {
          id: true,
          slug: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ critiques });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { critique, selectionData } = body;

  if (
    !critique ||
    typeof critique !== "string" ||
    critique.trim().length === 0
  ) {
    return NextResponse.json(
      { error: "Critique text is required" },
      { status: 400 },
    );
  }

  // Validate selectionData if provided
  if (selectionData) {
    if (selectionData.type === "image") {
      // Use typeof checks to allow 0 as a valid coordinate
      if (
        typeof selectionData.x !== "number" ||
        typeof selectionData.y !== "number" ||
        typeof selectionData.width !== "number" ||
        typeof selectionData.height !== "number" ||
        selectionData.width <= 0 ||
        selectionData.height <= 0 ||
        !selectionData.fragmentData ||
        typeof selectionData.fragmentData !== "string"
      ) {
        return NextResponse.json(
          { error: "Invalid image selection data" },
          { status: 400 },
        );
      }
    }
    if (
      selectionData.type === "text" &&
      (typeof selectionData.startIndex !== "number" ||
        typeof selectionData.endIndex !== "number" ||
        !selectionData.originalText)
    ) {
      return NextResponse.json(
        { error: "Invalid text selection data" },
        { status: 400 },
      );
    }
  }

  const submission = await prisma.submission.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      critiquesEnabled: true,
    },
  });

  if (!submission) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 },
    );
  }

  if (!submission.critiquesEnabled) {
    return NextResponse.json(
      { error: "Critiques are not enabled for this submission" },
      { status: 400 },
    );
  }

  // Prevent self-critique
  if (session.user.id === submission.userId) {
    return NextResponse.json(
      { error: "Cannot critique your own submission" },
      { status: 400 },
    );
  }

  // Process selection data if provided
  let processedSelectionData:
    | Prisma.NullableJsonNullValueInput
    | runtime.InputJsonValue = Prisma.JsonNull;
  if (selectionData) {
    if (selectionData.type === "text") {
      processedSelectionData = {
        type: "text",
        startIndex: selectionData.startIndex,
        endIndex: selectionData.endIndex,
        originalText: selectionData.originalText,
      };
    }
    // For image, we'll upload after we have the critique ID
  }

  // Create the critique first to get the ID
  const newCritique = await prisma.critique.create({
    data: {
      submissionId: id,
      critiquerId: session.user.id,
      critique,
      selectionData: processedSelectionData,
    },
    include: {
      critiquer: {
        select: {
          id: true,
          slug: true,
          name: true,
          image: true,
        },
      },
    },
  });

  // If image selection, upload fragment now that we have critique ID
  if (selectionData?.type === "image") {
    try {
      const fragmentUrl = await uploadFragment(
        id,
        newCritique.id,
        selectionData.fragmentData,
      );

      processedSelectionData = {
        type: "image",
        x: selectionData.x,
        y: selectionData.y,
        width: selectionData.width,
        height: selectionData.height,
        fragmentUrl,
      };

      // Update critique with fragment URL
      const updatedCritique = await prisma.critique.update({
        where: { id: newCritique.id },
        data: {
          selectionData: processedSelectionData,
        },
        include: {
          critiquer: {
            select: {
              id: true,
              slug: true,
              name: true,
              image: true,
            },
          },
        },
      });

      return NextResponse.json({ critique: updatedCritique });
    } catch (error) {
      console.error("Failed to upload fragment:", error);
      // Delete the critique if fragment upload fails
      await prisma.critique.delete({ where: { id: newCritique.id } });
      return NextResponse.json(
        { error: "Failed to upload image fragment" },
        { status: 500 },
      );
    }
  }

  // Send email notification to creator after response is sent
  after(async () => {
    try {
      await sendCritiqueNotification({
        critiquerId: session.user.id,
        submissionId: id,
      });
    } catch (error) {
      console.error("Failed to send critique notification:", error);
    }
  });

  return NextResponse.json({ critique: newCritique });
}
