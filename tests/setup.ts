import { expect } from '@jest/globals';
import * as matchers from '@testing-library/react-native/matchers';

process.env.EXPO_PUBLIC_SUPABASE_URL ??= 'https://test.supabase.co'
process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??= 'test-publishable-key'

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

// The native RevenueCat SDK loads a browser-only ESM dependency in Jest. App
// tests exercise entitlement-aware screens, not store billing itself, so use
// the smallest stable native facade here.
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    getCustomerInfo: jest.fn(),
    getOfferings: jest.fn(),
    addCustomerInfoUpdateListener: jest.fn(() => jest.fn()),
    logIn: jest.fn(),
    logOut: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
    setLogLevel: jest.fn(),
    setEmail: jest.fn(),
    setDisplayName: jest.fn(),
    setAttributes: jest.fn(),
  },
  LOG_LEVEL: { DEBUG: 'DEBUG' },
  PACKAGE_TYPE: { ANNUAL: 'ANNUAL', MONTHLY: 'MONTHLY' },
}))

jest.mock('react-native-purchases-ui', () => ({
  __esModule: true,
  default: { presentPaywall: jest.fn() },
  PAYWALL_RESULT: { NOT_PRESENTED: 'NOT_PRESENTED' },
}))

expect.extend(matchers);
