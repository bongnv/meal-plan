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
 */
export async function initializeMsal(): Promise<void> {
  await msalInstance.initialize()

  // Handle redirect response after login
  try {
    const response = await msalInstance.handleRedirectPromise()
    if (response) {
      console.log(
        '[MSAL] Redirect authentication successful:',
        response.account?.username
      )
    }
  } catch (error) {
    console.error('[MSAL] Redirect authentication failed:', error)
  }
}
