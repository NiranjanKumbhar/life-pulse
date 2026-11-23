/**
 * Prevents open-redirect attacks on OAuth callback `?next=` parameters.
 * Allows only internal relative paths (e.g. "/pulse", "/setup").
 */
export function sanitizeNextPath(
  rawNext: string | null | undefined,
  fallback = "/pulse"
): string {
  if (!rawNext) return fallback;
  const trimmed = rawNext.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) return fallback;
  if (/[\r\n]/.test(trimmed)) return fallback;
  return trimmed;
}
