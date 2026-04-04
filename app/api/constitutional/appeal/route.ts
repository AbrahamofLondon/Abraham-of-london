// app/api/constitutional/appeal/route.ts
// ─── CONSTITUTIONAL APPEAL ENDPOINT ───────────────────────────────────────────

import { NextResponse } from 'next/server';
import { createAppeal, validateAuthority } from '@/lib/constitution/constitutional-authority';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { actionId, reason, evidence } = await request.json();
    const userId = request.headers.get('X-User-Id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', ok: false },
        { status: 401 }
      );
    }

    // Fetch the action being appealed
    const action = await db.constitutionalAction.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      return NextResponse.json(
        { error: 'Action not found', ok: false },
        { status: 404 }
      );
    }

    // Create appeal
    const appeal = createAppeal(action, userId, reason, evidence);

    // Store in database
    await db.constitutionalAppeal.create({
      data: {
        id: appeal.id,
        actionId: appeal.actionId,
        appellantId: appeal.appellantId,
        reason: appeal.reason,
        evidence: appeal.evidence,
        status: appeal.status,
        filedAt: appeal.filedAt,
        escalationPath: appeal.escalationPath,
      },
    });

    // Notify review board (would use email/webhook in production)
    await notifyReviewBoard(appeal);

    return NextResponse.json({
      ok: true,
      appealId: appeal.id,
      status: appeal.status,
      escalationPath: appeal.escalationPath,
    });
  } catch (error) {
    console.error('Appeal submission failed:', error);
    return NextResponse.json(
      { error: 'Appeal submission failed', ok: false },
      { status: 500 }
    );
  }
}