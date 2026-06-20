import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Telegram login is only available from the verified Telegram Mini App button.",
    },
    { status: 410 },
  );
}
