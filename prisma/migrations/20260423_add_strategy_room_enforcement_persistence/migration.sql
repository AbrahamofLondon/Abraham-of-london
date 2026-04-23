-- Durable Strategy Room execution and enforcement persistence
CREATE TABLE IF NOT EXISTS "strategy_room_execution_sessions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionKey" TEXT NOT NULL,
  "strategyRoomSessionId" TEXT,
  "userId" TEXT,
  "email" TEXT,
  "directive" TEXT,
  "escalationLevel" TEXT,
  "conditionSummary" TEXT,
  "coreProblem" TEXT,
  "decisionQuestion" TEXT,
  "constraints" TEXT,
  "exposureLevel" TEXT,
  "interventionStack" TEXT,
  "constraintMap" TEXT,
  "canonicalSnapshot" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "strategy_room_execution_sessions_sessionKey_key" ON "strategy_room_execution_sessions"("sessionKey");
CREATE INDEX IF NOT EXISTS "strategy_room_execution_sessions_email_idx" ON "strategy_room_execution_sessions"("email");
CREATE INDEX IF NOT EXISTS "strategy_room_execution_sessions_status_idx" ON "strategy_room_execution_sessions"("status");

CREATE TABLE IF NOT EXISTS "strategy_decision_logs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "decisionObjectId" TEXT NOT NULL,
  "decision" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "notes" TEXT,
  "deadline" DATETIME,
  "avoidanceCount" INTEGER NOT NULL DEFAULT 0,
  "executedAt" DATETIME,
  "escalatedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "strategy_decision_logs_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "strategy_room_execution_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "strategy_decision_logs_decisionObjectId_fkey"
    FOREIGN KEY ("decisionObjectId") REFERENCES "DiagnosticDecisionObject"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "strategy_decision_logs_sessionId_idx" ON "strategy_decision_logs"("sessionId");
CREATE INDEX IF NOT EXISTS "strategy_decision_logs_status_idx" ON "strategy_decision_logs"("status");
CREATE INDEX IF NOT EXISTS "strategy_decision_logs_decisionObjectId_idx" ON "strategy_decision_logs"("decisionObjectId");

CREATE TABLE IF NOT EXISTS "consequence_timeline" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "label" TEXT NOT NULL,
  "trend" TEXT NOT NULL,
  "baseRisk" INTEGER NOT NULL DEFAULT 0,
  "timePenalty" INTEGER NOT NULL DEFAULT 0,
  "failurePenalty" INTEGER NOT NULL DEFAULT 0,
  "explanation" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "consequence_timeline_sessionId_idx" ON "consequence_timeline"("sessionId");
CREATE INDEX IF NOT EXISTS "consequence_timeline_createdAt_idx" ON "consequence_timeline"("createdAt");

CREATE TABLE IF NOT EXISTS "escalation_events" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "triggerType" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "decisionId" TEXT,
  "resolvedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "escalation_events_sessionId_idx" ON "escalation_events"("sessionId");
CREATE INDEX IF NOT EXISTS "escalation_events_createdAt_idx" ON "escalation_events"("createdAt");
