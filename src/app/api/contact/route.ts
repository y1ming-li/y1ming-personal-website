import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const data = await request.formData();

  const name = data.get("name");
  const email = data.get("email");
  const message = data.get("message");

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // TODO: send email / store in DB

  return NextResponse.json({ success: true });
}
