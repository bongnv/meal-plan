import { Configuration, RedirectRequest } from '@azure/msal-browser'

/**
 * MSAL Configuration for Microsoft authentication
 *
 * To use OneDrive sync, you need to:
 * 1. Register an app in Azure Portal (https://portal.azure.com)
 * 2. Navigate to Azure Active Directory > App registrations > New registration
 * 3. Set redirect URI to: http://localhost:5173 (for development)
 * 4. Copy the Application (client) ID
 * 5. Replace MSAL_CLIENT_ID below with your client ID
 *
 * For production, update the redirect URI to your production domain
 */

export const msalConfig: Configuration = {
  auth: {
    clientId:
      (import.meta as { env?: { VITE_MSAL_CLIENT_ID?: string } }).env
        ?.VITE_MSAL_CLIENT_ID || '',
    authority: 'https://login.microsoftonline.com/consumers',
    redirectUri:
      (import.meta as { env?: { VITE_REDIRECT_URI?: string } }).env
        ?.VITE_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage', // Store tokens in localStorage
  },
}

/**
 * Scopes required for OneDrive file access
 *
 * Files.ReadWrite.AppFolder - Access to app-specific folder in OneDrive
 * User.Read - Basic user profile information (name, email)
 */
export const loginRequest: RedirectRequest = {
  scopes: ['Files.ReadWrite', 'User.Read'],
}
