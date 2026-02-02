import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { ExhibitRequestEmail } from "@/emails/templates/exhibit-request-email";

interface ExhibitRequestBody {
  exhibitName: string;
  exhibitDescription: string;
  submissionIds: string[];
  userEmail: string;
  userName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExhibitRequestBody = await request.json();

    // Validate required fields
    if (
      !body.exhibitName?.trim() ||
      !body.exhibitDescription?.trim() ||
      !body.submissionIds ||
      body.submissionIds.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Exhibit name, description, and at least one submission are required",
        },
        { status: 400 },
      );
    }

    if (!body.userEmail || !body.userName) {
      return NextResponse.json(
        { error: "User email and name are required" },
        { status: 400 },
      );
    }

    // Fetch submission details
    const submissions = await prisma.submission.findMany({
      where: {
        id: {
          in: body.submissionIds,
        },
      },
      select: {
        id: true,
        title: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (submissions.length === 0) {
      return NextResponse.json(
        { error: "No valid submissions found" },
        { status: 400 },
      );
    }

    // Send email to karim
    await sendEmail({
      to: "karim@create.spot",
      subject: `Exhibit Request: ${body.exhibitName}`,
      react: React.createElement(ExhibitRequestEmail, {
        requesterName: body.userName,
        requesterEmail: body.userEmail,
        exhibitName: body.exhibitName,
        exhibitDescription: body.exhibitDescription,
        submissions,
        baseUrl: process.env.NEXTAUTH_URL,
      }),
    });

    return NextResponse.json(
      { success: true, message: "Exhibit request submitted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error submitting exhibit request:", error);
    return NextResponse.json(
      { error: "Failed to submit exhibit request" },
      { status: 500 },
    );
  }
}
