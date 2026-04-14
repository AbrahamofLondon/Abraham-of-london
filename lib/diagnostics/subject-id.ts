export function getOrCreateSubjectId(): string {
  if (typeof window === "undefined") return "";
  const key = "aol_subject_id";
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  sessionStorage.setItem(key, id);
  return id;
}

export function getSubjectId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("aol_subject_id");
}

export function clearSubjectId(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("aol_subject_id");
}
