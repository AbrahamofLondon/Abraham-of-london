# Prisma Access Model Verification

**Date:** 8 May 2026  
**Source:** `prisma/schema.prisma`  

---

## 1. User.role

**Status:** ✅ PRESENT

```prisma
model User {
  id            String         @id @default(cuid())
  name          String?
  email         String?        @unique
  emailVerified DateTime?
  image         String?
  role          UserRole       @default(USER)
  ...
}

enum UserRole {
  USER
  ADMIN
  OWNER
}
```

**Fields present:** `id`, `name`, `email`, `emailVerified`, `image`, `role`, `createdAt`, `updatedAt`  
**Indexes:** `@@index([role])`  
**Uniques:** `email` (optional)  

**Assessment:** ✅ Complete. No missing fields against contract.

---

## 2. Entitlement

**Status:** ✅ PRESENT

```prisma
model Entitlement {
  id          String             @id @default(cuid())
  userId      String
  user        User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  type        EntitlementType
  key         String
  status      EntitlementStatus  @default(ACTIVE)
  metadata    Json?
  issuedAt    DateTime           @default(now())
  startsAt    DateTime?
  expiresAt   DateTime?
  revokedAt   DateTime?
  issuedBy    String?
  revokedBy   String?
  reason      String?
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt

  @@index([userId, type, status])
  @@index([key, type, status])
  @@unique([userId, type, key, status], map: "entitlement_active_uniqueness")
}

enum EntitlementType {
  TIER
  PRODUCT
  ARTIFACT
}

enum EntitlementStatus {
  ACTIVE
  REVOKED
  EXPIRED
}
```

**Fields present:** `id`, `userId`, `user` (relation), `type`, `key`, `status`, `metadata`, `issuedAt`, `startsAt`, `expiresAt`, `revokedAt`, `issuedBy`, `revokedBy`, `reason`, `createdAt`, `updatedAt`  
**Indexes:** `[userId, type, status]`, `[key, type, status]`  
**Uniques:** Composite unique on `[userId, type, key, status]`  

**Assessment:** ✅ Complete. The composite unique ensures a user can have only one active entitlement per type+key combination.

---

## 3. AccessKey

**Status:** ✅ PRESENT

```prisma
model AccessKey {
  id            String           @id @default(cuid())
  codeHash      String           @unique
  codePreview   String
  label         String?
  status        AccessKeyStatus  @default(ACTIVE)
  grants        Json
  metadata      Json?
  maxUses       Int              @default(1)
  uses          Int              @default(0)
  startsAt      DateTime?
  expiresAt     DateTime?
  revokedAt     DateTime?
  issuedBy      String?
  revokedBy     String?
  reason        String?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
  usesLog       AccessKeyUse[]

  @@index([status])
  @@index([expiresAt])
}

enum AccessKeyStatus {
  ACTIVE
  REVOKED
  EXPIRED
  DEPLETED
}
```

**Fields present:** `id`, `codeHash` (unique), `codePreview`, `label`, `status`, `grants` (Json), `metadata` (Json), `maxUses`, `uses`, `startsAt`, `expiresAt`, `revokedAt`, `issuedBy`, `revokedBy`, `reason`, `createdAt`, `updatedAt`, `usesLog` (relation)  
**Indexes:** `[status]`, `[expiresAt]`  
**Uniques:** `codeHash`  

**Assessment:** ✅ Complete. Supports grants as JSON array of `{type, key}` objects.

---

## 4. AccessKeyUse

**Status:** ✅ PRESENT

```prisma
model AccessKeyUse {
  id           String     @id @default(cuid())
  accessKeyId  String
  accessKey    AccessKey  @relation(fields: [accessKeyId], references: [id], onDelete: Cascade)
  userId       String
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  redeemedAt   DateTime   @default(now())
  ipAddress    String?
  userAgent    String?

  @@index([accessKeyId])
  @@index([userId])
  @@unique([accessKeyId, userId])
}
```

**Fields present:** `id`, `accessKeyId`, `accessKey` (relation), `userId`, `user` (relation), `redeemedAt`, `ipAddress`, `userAgent`  
**Indexes:** `[accessKeyId]`, `[userId]`  
**Uniques:** `[accessKeyId, userId]` — prevents double-redeem  

**Assessment:** ✅ Complete.

---

## 5. AccessInvite

**Status:** ✅ PRESENT — ALL REQUIRED FIELDS MATCH

```prisma
model AccessInvite {
  id               String       @id @default(cuid())
  recipientEmail   String
  tokenHash        String       @unique
  grants           Json         // Array<{type, key}>
  status           InviteStatus @default(PENDING)
  issuedBy         String?
  issuedAt         DateTime     @default(now())
  expiresAt        DateTime?
  redeemedByUserId String?
  redeemedAt       DateTime?
  revokedAt        DateTime?
  revokedBy        String?
  reason           String?
  maxUses          Int          @default(1)
  uses             Int          @default(0)
  metadata         Json?
  emailSentAt      DateTime?
  emailError       String?
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  @@index([recipientEmail])
  @@index([status])
  @@index([expiresAt])
  @@map("access_invites")
}

enum InviteStatus {
  PENDING
  REDEEMED
  EXPIRED
  REVOKED
}
```

**Contract field verification:**

| Required Field | Present | Match |
|---------------|---------|-------|
| `recipientEmail` | ✅ `recipientEmail` | ✅ |
| `tokenHash` | ✅ `tokenHash` (unique) | ✅ |
| `grants` | ✅ `grants` (Json) | ✅ |
| `status` | ✅ `status` (InviteStatus enum) | ✅ |
| `issuedBy` | ✅ `issuedBy` (optional) | ✅ |
| `issuedAt` | ✅ `issuedAt` (default now()) | ✅ |
| `expiresAt` | ✅ `expiresAt` (optional) | ✅ |
| `redeemedByUserId` | ✅ `redeemedByUserId` (optional) | ✅ |
| `redeemedAt` | ✅ `redeemedAt` (optional) | ✅ |
| `maxUses` | ✅ `maxUses` (default 1) | ✅ |
| `uses` | ✅ `uses` (default 0) | ✅ |
| `metadata` | ✅ `metadata` (Json, optional) | ✅ |

**Extra fields (not in contract but present):** `emailSentAt`, `emailError`, `revokedBy`, `reason`, `createdAt`, `updatedAt`  
**Assessment:** ✅ Complete. All required contract fields present. Extra fields are additive improvements.

---

## 6. AccessAuditLog

**Status:** ✅ PRESENT

```prisma
model AccessAuditLog {
  id            String         @id @default(cuid())
  actorType     AuditActorType
  actorUserId   String?
  actorEmail    String?
  action        String
  targetType    String
  targetKey     String?
  success       Boolean        @default(true)
  reason        String?
  metadata      Json?
  createdAt     DateTime       @default(now())

  @@index([action, createdAt])
  @@index([actorUserId, createdAt])
  @@index([targetType, targetKey])
}

enum AuditActorType {
  USER
  SYSTEM
  ADMIN
}
```

**Fields present:** `id`, `actorType`, `actorUserId`, `actorEmail`, `action`, `targetType`, `targetKey`, `success`, `reason`, `metadata`, `createdAt`  
**Indexes:** `[action, createdAt]`, `[actorUserId, createdAt]`, `[targetType, targetKey]`  

**Assessment:** ✅ Complete.

---

## 7. Enum Compatibility

| Enum | Values | Compatible |
|------|--------|------------|
| `UserRole` | `USER`, `ADMIN`, `OWNER` | ✅ |
| `EntitlementType` | `TIER`, `PRODUCT`, `ARTIFACT` | ✅ |
| `EntitlementStatus` | `ACTIVE`, `REVOKED`, `EXPIRED` | ✅ |
| `AccessKeyStatus` | `ACTIVE`, `REVOKED`, `EXPIRED`, `DEPLETED` | ✅ |
| `InviteStatus` | `PENDING`, `REDEEMED`, `EXPIRED`, `REVOKED` | ✅ |
| `AuditActorType` | `USER`, `SYSTEM`, `ADMIN` | ✅ |

**Assessment:** ✅ All enums compatible with service layer expectations.

---

## 8. Service Compatibility

| Service | Models Used | Compatible |
|---------|-------------|------------|
| `getUserAccess()` | `user`, `entitlement` | ✅ |
| `grantEntitlements()` | `entitlement` | ✅ |
| `redeemInvite()` | `accessInvite`, `entitlement` | ✅ |
| `createInvite()` | `accessInvite` | ✅ |
| `revokeInvite()` | `accessInvite` | ✅ |
| Key redemption | `accessKey`, `accessKeyUse`, `entitlement` | ✅ |
| `logAccessAudit()` | `accessAuditLog` | ✅ |

**Assessment:** ✅ All services compatible with current schema.

---

## 9. Migration Risk

**Current state:** Schema is stable and deployed.  
**Risk factors:**
- Adding fields to existing models: LOW (nullable/optional)
- Removing fields: HIGH (data loss)
- Changing enum values: MEDIUM (requires migration + code update)
- Adding new models: LOW

**Assessment:** ✅ Low migration risk for additive changes. Any destructive changes require careful planning.

---

## Summary

| Model | Status | Notes |
|-------|--------|-------|
| `User.role` | ✅ Complete | Uses `UserRole` enum |
| `Entitlement` | ✅ Complete | Composite unique prevents duplicates |
| `AccessKey` | ✅ Complete | Grants stored as JSON |
| `AccessKeyUse` | ✅ Complete | Unique constraint prevents double-redeem |
| `AccessInvite` | ✅ Complete | All contract fields match, plus extras |
| `AccessAuditLog` | ✅ Complete | Full audit trail |

**No mismatches found. No patches required.**
