export const SESSION_COOKIE_NAME = "fin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 90; // 90 dias

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sessionTokenFor(password: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return bufferToHex(digest);
}

export async function isValidSession(
  cookieValue: string | undefined,
  appPassword: string,
): Promise<boolean> {
  if (!cookieValue) return false;
  const expected = await sessionTokenFor(appPassword);
  return cookieValue === expected;
}
