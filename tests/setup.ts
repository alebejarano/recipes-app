import { expect } from '@jest/globals';
import * as matchers from '@testing-library/react-native/matchers';

process.env.EXPO_PUBLIC_SUPABASE_URL ??= 'https://test.supabase.co'
process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??= 'test-publishable-key'

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

expect.extend(matchers);
