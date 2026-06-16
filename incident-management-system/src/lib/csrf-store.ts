// Simple client-side in-memory CSRF token store
let csrfToken = "";

export function getCsrfToken(): string {
  return csrfToken;
}

export function setCsrfToken(token: string): void {
  csrfToken = token;
}
