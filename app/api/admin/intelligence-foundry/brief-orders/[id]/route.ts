// PATCH /api/admin/intelligence-foundry/brief-orders/[id]
// Updates the status of a Decision Brief Order.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || typeof status !== "string") {
      return NextResponse.json({ ok: false, error: "STATUS_REQUIRED" }, { status: 400 });
    }

    const validStatuses = ["pending", "in_review", "delivered", "cancelled", "refunded"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ ok: false, error: "INVALID_STATUS" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { status };

    if (status === "delivered") {
      updateData.deliveredAt = new Date();
    }

    const order = await prisma.decisionBriefOrder.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ ok: true, order });
  } catch (error) {
    console.error("[BRIEF_ORDERS_PATCH]", error);
    return NextResponse.json({ ok: false, error: "FAILED" }, { status: 500 });
  }
}
