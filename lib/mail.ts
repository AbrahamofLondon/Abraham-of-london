// RE-EXPORT BARREL — All enterprise email logic lives in enterprise-mail-service.ts
// This file exists only for backward compatibility. Do not add implementations here.
export {
  sendAccessRequestEmail,
  sendExecutiveBriefNotification,
  sendCampaignNudgeEmail,
  sendInternalAccessRequestNotification,
} from "@/lib/mail/enterprise-mail-service";

export type {
  SendEmailResult,
  ExecutiveBriefParams,
  CampaignNudgeParams,
} from "@/lib/mail/enterprise-mail-service";
