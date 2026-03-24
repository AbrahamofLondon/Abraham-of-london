import { NextResponse } from "next/server";
import { runMonthlyReminderSweep } from "@/lib/alignment/reminders";

export async function POST() {
  await runMonthlyReminderSweep();
  return NextResponse.json({ ok: true });
}