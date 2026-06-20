import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Website checkout is disabled. Please buy packages from the Telegram bot chat.",
    },
    { status: 410 },
  );
}
