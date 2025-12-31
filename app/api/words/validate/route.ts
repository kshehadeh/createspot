import { NextRequest, NextResponse } from "next/server";
import { isValidWord } from "@/lib/words";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get("word");
  
  if (!word) {
    return NextResponse.json(
      { error: "Word parameter is required" },
      { status: 400 }
    );
  }
  
  const valid = isValidWord(word);
  
  return NextResponse.json({ word, valid });
}
