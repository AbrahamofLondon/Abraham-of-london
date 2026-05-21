export type AuthSafeErrorCode =
  | "AUTH_DATABASE_UNAVAILABLE"
  | "AUTH_DATABASE_CONFIGURATION_ERROR"
  | "AUTH_DATABASE_AUTHENTICATION_FAILED"
  | "AUTH_SIGNIN_FAILED";

export type AuthSafeError = {
  code: AuthSafeErrorCode;
  clientMessage: string;
};

const GENERIC_AUTH_MESSAGE =
  "Authentication is temporarily unavailable. Please try again later or contact support.";

function errorText(error: unknown): string {
  if (error instanceof Error) {
    return `${error.constructor?.name || ""} ${error.name || ""} ${error.message || ""}`;
  }
  return String(error || "");
}

export function classifyAuthError(error: unknown): AuthSafeError {
  const text = errorText(error).toLowerCase();

  if (
    text.includes("authentication failed against database server") ||
    text.includes("provided database credentials") ||
    text.includes("password authentication failed") ||
    text.includes("p1000")
  ) {
    return {
      code: "AUTH_DATABASE_AUTHENTICATION_FAILED",
      clientMessage: GENERIC_AUTH_MESSAGE,
    };
  }

  if (
    text.includes("database_url") ||
    text.includes("must start with postgresql://") ||
    text.includes("must start with postgres://") ||
    text.includes("url must start with the protocol") ||
    text.includes("environment variable not found")
  ) {
    return {
      code: "AUTH_DATABASE_CONFIGURATION_ERROR",
      clientMessage: GENERIC_AUTH_MESSAGE,
    };
  }

  if (
    text.includes("can't reach database server") ||
    text.includes("cannot reach database server") ||
    text.includes("connect etimedout") ||
    text.includes("connect econnrefused") ||
    text.includes("connection refused") ||
    text.includes("connection terminated") ||
    text.includes("pooler") ||
    text.includes("neon.tech") ||
    text.includes("p1001")
  ) {
    return {
      code: "AUTH_DATABASE_UNAVAILABLE",
      clientMessage: GENERIC_AUTH_MESSAGE,
    };
  }

  if (
    text.includes("prisma client initialization") ||
    text.includes("prismaclientinitializationerror")
  ) {
    return {
      code: "AUTH_DATABASE_CONFIGURATION_ERROR",
      clientMessage: GENERIC_AUTH_MESSAGE,
    };
  }

  return {
    code: "AUTH_SIGNIN_FAILED",
    clientMessage: GENERIC_AUTH_MESSAGE,
  };
}

export function safeAuthClientMessage(): string {
  return GENERIC_AUTH_MESSAGE;
}

export function sanitizeAuthErrorParam(input: unknown): AuthSafeErrorCode {
  if (input === "AUTH_DATABASE_UNAVAILABLE") return "AUTH_DATABASE_UNAVAILABLE";
  if (input === "AUTH_DATABASE_CONFIGURATION_ERROR") return "AUTH_DATABASE_CONFIGURATION_ERROR";
  if (input === "AUTH_DATABASE_AUTHENTICATION_FAILED") return "AUTH_DATABASE_AUTHENTICATION_FAILED";
  return "AUTH_SIGNIN_FAILED";
}
