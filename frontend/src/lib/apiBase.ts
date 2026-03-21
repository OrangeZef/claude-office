/**
 * Derives the backend API base URL from the current browser origin.
 * Works whether accessed via localhost or a remote IP/hostname.
 */
export const API_BASE_URL =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.host}`
    : "http://localhost:8000";
