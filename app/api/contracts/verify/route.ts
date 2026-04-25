// app/api/contracts/verify/route.ts
// POST /api/contracts/verify - Verify or breach a pattern-breaker contract

import { NextRequest, NextResponse } from "next/server";
import { updateContractStatus, getContracts, getContractById } from "@/lib/alignment/contract-engine";
import { track } from "@/lib/analytics/track";

// In production, this would use a database.
// For now, we use the localStorage-based engine (which will be called from server context carefully)
// Note: This API expects to be called from the client, which has localStorage.
// For production, migrate to a database.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractId, completed, userNote, verificationToken } = body;
    
    if (!contractId) {
      return NextResponse.json(
        { error: "contractId is required" },
        { status: 400 }
      );
    }
    
    // For production: validate verificationToken against stored token
    // For now, we trust the request (since localStorage is client-side only)
    
    const status = completed ? "completed" : "breached";
    const now = new Date().toISOString();
    
    updateContractStatus(contractId, status, {
      completedAt: completed ? now : undefined,
      breachedAt: completed ? undefined : now,
      breachReason: completed ? undefined : userNote || "User reported non-completion",
    });
    
    // Track the verification event
    track("contract_verification", {
      contractId,
      status,
      hasNote: !!userNote,
    });
    
    // In production: 
    // - Send email confirmation to user
    // - Update longitudinal intelligence
    // - Trigger webhook to connected services
    // - Update peer analytics
    
    return NextResponse.json({
      success: true,
      status,
      message: completed 
        ? "Contract marked as completed. The system will remember this accomplishment."
        : "Contract marked as breached. Future assessments will reflect this.",
    });
    
  } catch (error) {
    console.error("Contract verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/contracts/verify?contractId=xxx - Check contract status
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const contractId = searchParams.get("contractId");
  
  if (!contractId) {
    return NextResponse.json(
      { error: "contractId is required" },
      { status: 400 }
    );
  }
  
  // Note: This won't work in production without a database
  // This is a placeholder for the full implementation
  
  return NextResponse.json({
    contractId,
    status: "pending", // Would fetch from DB
    message: "Verification endpoint ready. Full implementation requires database migration.",
  });
}

// DELETE /api/contracts/verify?contractId=xxx - Cancel a pending contract
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const contractId = searchParams.get("contractId");
  
  if (!contractId) {
    return NextResponse.json(
      { error: "contractId is required" },
      { status: 400 }
    );
  }
  
  updateContractStatus(contractId, "archived");
  
  track("contract_cancelled", { contractId });
  
  return NextResponse.json({
    success: true,
    message: "Contract cancelled and archived",
  });
}