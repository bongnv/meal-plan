import { Configuration, PopupRequest } from '@azure/msal-browser';

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

/**
 * Detect if running in Safari browser
 */
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

export const msalConfig: Configuration = {
  auth: {
    clientId: (import.meta as { env?: { VITE_MSAL_CLIENT_ID?: string } }).env?.VITE_MSAL_CLIENT_ID || 'YOUR_CLIENT_ID_HERE',
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: (import.meta as { env?: { VITE_REDIRECT_URI?: string } }).env?.VITE_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: isSafari ? 'sessionStorage' : 'localStorage', // Safari compatibility
  },
};

/**
 * Scopes required for OneDrive file access
 * 
 * Files.ReadWrite.AppFolder - Access to app-specific folder in OneDrive
 * User.Read - Basic user profile information (name, email)
 */
export const loginRequest: PopupRequest = {
  scopes: ['Files.ReadWrite.AppFolder', 'User.Read'],
};
