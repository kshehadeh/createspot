import { NextResponse } from "next/server";
import { getRandomWord } from "@/lib/words";

export async function GET() {
  const word = getRandomWord();

  if (!word) {
    return NextResponse.json(
      { error: "Word list not available" },
      { status: 503 },
    );
  }

  return NextResponse.json({ word });
}
