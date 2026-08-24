import { fireEvent, render } from '@testing-library/react-native'

import GetStartedScreen from '../GetStartedScreen'

const mockReplace = jest.fn()
const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
}))
jest.mock('@/localization', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('@/components/IllustrationHero', () => 'IllustrationHero')

describe('<GetStartedScreen />', () => {
  beforeEach(() => {
    mockReplace.mockClear()
    mockPush.mockClear()
  })

  it('offers guest, login, and registration paths', async () => {
    const { getByText } = await render(<GetStartedScreen />)

    await fireEvent.press(getByText('auth.getStarted.continueAsGuest'))
    expect(mockReplace).toHaveBeenCalledWith('/(public)/(tabs)')

    await fireEvent.press(getByText('auth.getStarted.login'))
    expect(mockPush).toHaveBeenCalledWith('/(public)/login')

    await fireEvent.press(getByText('auth.getStarted.createAccount'))
    expect(mockPush).toHaveBeenCalledWith('/(public)/register')
  })
})
