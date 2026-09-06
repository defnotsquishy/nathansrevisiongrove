import settings from '../pages/cloud.json';
export const cloudSettings = settings;
export const cloudConfigured =
  settings.enabled &&
  Boolean(
    settings.firebase.apiKey &&
    settings.firebase.authDomain &&
    settings.firebase.projectId &&
    settings.firebase.appId &&
    settings.privacyEmail,
  );
export type CloudUser = {
  uid: string;
  email: string;
  username: string;
  verified: boolean;
};
export type Role = 'member' | 'admin' | 'owner';
export function accountError(error: unknown): string {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String(error.code)
      : '';
  if (
    /invalid-credential|user-not-found|wrong-password|invalid-email/.test(code)
  )
    return 'Sign-in failed. Check your email and password, or reset your password.';
  if (/email-already-in-use/.test(code))
    return 'An account could not be created. Try signing in or resetting your password.';
  if (/too-many-requests|resource-exhausted/.test(code))
    return 'Too many requests, or the free service has reached its limit. Please try again later.';
  if (/network|unavailable|deadline-exceeded/.test(code))
    return 'The account service could not be reached. Your change has not been saved. Check your connection and try again.';
  if (/permission-denied|unauthenticated/.test(code))
    return 'This action is not allowed. Verify your email and sign in again. If it continues, contact the site owner.';
  if (/requires-recent-login/.test(code))
    return 'For your security, sign out and sign in again before deleting your account.';
  if (/weak-password/.test(code))
    return 'Choose a password with at least 12 characters.';
  return error instanceof Error && !code
    ? error.message
    : 'The request could not be completed. Please try again.';
}
