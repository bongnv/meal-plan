import {
  PublicClientApplication,
  type IPublicClientApplication,
} from '@azure/msal-browser'

import { msalConfig } from './msalConfig'

/**
 * Shared MSAL instance for OneDrive authentication
 *
 * This instance is initialized once and shared across the application.
 * Use this instead of msal-react's MsalProvider for manual initialization.
 */
export const msalInstance: IPublicClientApplication =
  new PublicClientApplication(msalConfig)

/**
 * Initialize MSAL instance and handle redirect response
 *
 * Must be called before using MSAL authentication.
 * Safe to call multiple times - will only initialize once.
 *
 * Handles redirect responses when user returns from Microsoft login.
 */
export async function initializeMsal(): Promise<void> {
  await msalInstance.initialize()

  // Handle redirect response when returning from Microsoft login
  // This is critical for loginRedirect flow to work properly
  try {
    const response = await msalInstance.handleRedirectPromise()
    if (response) {
      // User just logged in via redirect
      console.log('[MSAL] Redirect authentication successful:', response.account?.username)
    }
  } catch (error) {
    console.error('[MSAL] Redirect authentication failed:', error)
    // Don't throw - allow app to load even if redirect handling fails
  }
}
