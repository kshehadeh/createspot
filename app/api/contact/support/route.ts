import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { sendEmail } from "@/lib/email";
import { ContactSupportEmail } from "@/emails/templates/contact-support-email";

interface SupportRequestBody {
  description: string;
  pageUrl: string;
  userEmail: string;
  userName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SupportRequestBody = await request.json();

    // Validate required fields
    if (!body.description?.trim() || !body.pageUrl?.trim()) {
      return NextResponse.json(
        { error: "Description and page URL are required" },
        { status: 400 },
      );
    }

    if (!body.userEmail || !body.userName) {
      return NextResponse.json(
        { error: "User email and name are required" },
        { status: 400 },
      );
    }

    // Send confirmation email to user
    await sendEmail({
      to: body.userEmail,
      subject: "We received your bug report",
      react: React.createElement(ContactSupportEmail, {
        userName: body.userName,
        description: body.description,
        pageUrl: body.pageUrl,
        baseUrl: process.env.NEXTAUTH_URL,
      }),
    });

    return NextResponse.json(
      { success: true, message: "Bug report submitted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error submitting bug report:", error);
    return NextResponse.json(
      { error: "Failed to submit bug report" },
      { status: 500 },
    );
  }
}
