import { vi } from 'vitest'

import type { IPublicClientApplication } from '@azure/msal-browser'

/**
 * Create a mock MSAL instance for testing
 *
 * Returns a mock IPublicClientApplication with all required methods.
 */
export function createMockMsalInstance(): IPublicClientApplication {
  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    getAllAccounts: vi.fn(() => []),
    getAccountByHomeId: vi.fn(() => null),
    getAccountByLocalId: vi.fn(() => null),
    getAccountByUsername: vi.fn(() => null),
    handleRedirectPromise: vi.fn().mockResolvedValue(null),
    loginPopup: vi.fn().mockResolvedValue({
      account: null,
      idToken: '',
      accessToken: '',
      fromCache: false,
      expiresOn: null,
      scopes: [],
      uniqueId: '',
      tenantId: '',
    }),
    loginRedirect: vi.fn().mockResolvedValue(undefined),
    logoutPopup: vi.fn().mockResolvedValue(undefined),
    logoutRedirect: vi.fn().mockResolvedValue(undefined),
    acquireTokenSilent: vi.fn().mockResolvedValue({
      account: null,
      idToken: '',
      accessToken: 'mock-access-token',
      fromCache: false,
      expiresOn: null,
      scopes: [],
      uniqueId: '',
      tenantId: '',
    }),
    acquireTokenPopup: vi.fn().mockResolvedValue({
      account: null,
      idToken: '',
      accessToken: 'mock-access-token',
      fromCache: false,
      expiresOn: null,
      scopes: [],
      uniqueId: '',
      tenantId: '',
    }),
    acquireTokenRedirect: vi.fn().mockResolvedValue(undefined),
    ssoSilent: vi.fn().mockResolvedValue({
      account: null,
      idToken: '',
      accessToken: 'mock-access-token',
      fromCache: false,
      expiresOn: null,
      scopes: [],
      uniqueId: '',
      tenantId: '',
    }),
    getTokenCache: vi.fn(() => ({
      loadExternalTokens: vi.fn(),
    })) as any,
    getLogger: vi.fn(),
    setLogger: vi.fn(),
    setActiveAccount: vi.fn(),
    getActiveAccount: vi.fn(() => null),
    initializeWrapperLibrary: vi.fn(),
    setNavigationClient: vi.fn(),
    getConfiguration: vi.fn(() => ({
      auth: {
        clientId: 'mock-client-id',
        authority: 'https://login.microsoftonline.com/common',
      },
      cache: {
        cacheLocation: 'localStorage',
      },
    })) as any,
    hydrateCache: vi.fn().mockResolvedValue(undefined),
    clearCache: vi.fn().mockResolvedValue(undefined),
    addEventCallback: vi.fn(() => 'mock-callback-id'),
    removeEventCallback: vi.fn(),
    enableAccountStorageEvents: vi.fn(),
    disableAccountStorageEvents: vi.fn(),
    acquireTokenByCode: vi.fn().mockResolvedValue({
      account: null,
      idToken: '',
      accessToken: 'mock-access-token',
      fromCache: false,
      expiresOn: null,
      scopes: [],
      uniqueId: '',
      tenantId: '',
    }),
    addPerformanceCallback: vi.fn(() => 'mock-perf-callback-id'),
    removePerformanceCallback: vi.fn(() => true),
    getAccount: vi.fn(() => null),
  } as IPublicClientApplication
}
