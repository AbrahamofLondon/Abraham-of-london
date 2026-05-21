const LINKEDIN_CALLBACK_PATH =
  "/api/admin/outbound/linkedin/oauth/callback";

export type LinkedInAppProfileKey = "legacy" | "community";

export type LinkedInAppProfile = {
  profileKey: LinkedInAppProfileKey;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  intendedUse: string;
  requiredScopes: string[];
};

export type LinkedInAppProfileDiagnostics = {
  activeProfile: LinkedInAppProfileKey;
  activeProfileValid: boolean;
  callbackRouteExpectedUrl: string;
  profiles: Record<
    LinkedInAppProfileKey,
    {
      clientIdPresent: boolean;
      clientSecretPresent: boolean;
      redirectUriPresent: boolean;
      configured: boolean;
      requiredScopes: string[];
      intendedUse: string;
    }
  >;
};

export class LinkedInAppProfileError extends Error {
  readonly code:
    | "LINKEDIN_PROFILE_INVALID"
    | "LINKEDIN_PROFILE_INCOMPLETE";

  constructor(
    code: LinkedInAppProfileError["code"],
    message: string,
  ) {
    super(message);
    this.name = "LinkedInAppProfileError";
    this.code = code;
  }
}

const COMMUNITY_SCOPES = [
  "openid",
  "profile",
  "email",
  "r_organization_admin",
  "r_organization_social",
  "w_organization_social",
];

const LEGACY_DEFAULT_SCOPES = [
  "openid",
  "profile",
  "email",
  "w_member_social",
  "w_organization_social",
  "r_organization_social",
];

function value(name: string): string {
  return String(process.env[name] || "").trim();
}

function splitScopes(scopes: string): string[] {
  return Array.from(
    new Set(scopes.split(/\s+/).map((scope) => scope.trim()).filter(Boolean)),
  );
}

function callbackRouteFromBase(): string {
  const base =
    value("NEXT_PUBLIC_APP_URL") ||
    value("NEXTAUTH_URL") ||
    "http://localhost:3000";
  return `${base.replace(/\/+$/, "")}${LINKEDIN_CALLBACK_PATH}`;
}

function profileInputs(profileKey: LinkedInAppProfileKey) {
  if (profileKey === "community") {
    return {
      clientId: value("LINKEDIN_COMMUNITY_CLIENT_ID"),
      clientSecret: value("LINKEDIN_COMMUNITY_CLIENT_SECRET"),
      redirectUri: value("LINKEDIN_COMMUNITY_REDIRECT_URI"),
      requiredScopes: COMMUNITY_SCOPES,
      intendedUse:
        "Governed Abraham of London organisation-page publishing and Community Management workflows.",
    };
  }

  return {
    clientId: value("LINKEDIN_LEGACY_CLIENT_ID") || value("LINKEDIN_CLIENT_ID"),
    clientSecret:
      value("LINKEDIN_LEGACY_CLIENT_SECRET") || value("LINKEDIN_CLIENT_SECRET"),
    redirectUri:
      value("LINKEDIN_LEGACY_REDIRECT_URI") || value("LINKEDIN_REDIRECT_URI"),
    requiredScopes: splitScopes(
      value("LINKEDIN_LEGACY_OAUTH_SCOPES") ||
        value("LINKEDIN_OAUTH_SCOPES") ||
        LEGACY_DEFAULT_SCOPES.join(" "),
    ),
    intendedUse:
      "Existing LinkedIn OAuth/product access retained for approved legacy workflows.",
  };
}

export function isLinkedInAppProfileKey(
  valueToCheck: unknown,
): valueToCheck is LinkedInAppProfileKey {
  return valueToCheck === "legacy" || valueToCheck === "community";
}

export function getActiveLinkedInProfileKey(): LinkedInAppProfileKey {
  const configured = value("LINKEDIN_ACTIVE_PROFILE");
  return isLinkedInAppProfileKey(configured) ? configured : "legacy";
}

export function resolveLinkedInAppProfile(
  profileKey = getActiveLinkedInProfileKey(),
): LinkedInAppProfile {
  if (!isLinkedInAppProfileKey(profileKey)) {
    throw new LinkedInAppProfileError(
      "LINKEDIN_PROFILE_INVALID",
      "LinkedIn application profile is invalid.",
    );
  }

  const inputs = profileInputs(profileKey);
  if (!inputs.clientId || !inputs.clientSecret || !inputs.redirectUri) {
    throw new LinkedInAppProfileError(
      "LINKEDIN_PROFILE_INCOMPLETE",
      `LinkedIn ${profileKey} application profile is incomplete.`,
    );
  }

  return {
    profileKey,
    clientId: inputs.clientId,
    clientSecret: inputs.clientSecret,
    redirectUri: inputs.redirectUri,
    intendedUse: inputs.intendedUse,
    requiredScopes: inputs.requiredScopes,
  };
}

export function getLinkedInAppProfileDiagnostics(): LinkedInAppProfileDiagnostics {
  const activeProfile = getActiveLinkedInProfileKey();
  const profiles = (["legacy", "community"] as const).reduce(
    (diagnostics, profileKey) => {
      const inputs = profileInputs(profileKey);
      diagnostics[profileKey] = {
        clientIdPresent: Boolean(inputs.clientId),
        clientSecretPresent: Boolean(inputs.clientSecret),
        redirectUriPresent: Boolean(inputs.redirectUri),
        configured: Boolean(
          inputs.clientId &&
            inputs.clientSecret &&
            inputs.redirectUri,
        ),
        requiredScopes: inputs.requiredScopes,
        intendedUse: inputs.intendedUse,
      };
      return diagnostics;
    },
    {} as LinkedInAppProfileDiagnostics["profiles"],
  );

  return {
    activeProfile,
    activeProfileValid: profiles[activeProfile].configured,
    callbackRouteExpectedUrl: callbackRouteFromBase(),
    profiles,
  };
}
