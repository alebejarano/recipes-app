import { act, render } from '@testing-library/react-native'
import { AppState, Text } from 'react-native'

import AppUpdateGate from '../AppUpdateGate'

const mockAppStateListeners = new Set<(state: string) => void>()
const mockGetCachedAppUpdateRequirement = jest.fn()
const mockGetRemoteAppUpdateRequirement = jest.fn()

jest.mock('@/components/Button', () => 'Button')
jest.mock('@/components/Screen', () => 'Screen')
jest.mock('@/localization', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('@/features/app-update/services/appUpdateService', () => ({
    cacheAppUpdateRequirement: jest.fn(),
    getCachedAppUpdateRequirement: (...args: unknown[]) => mockGetCachedAppUpdateRequirement(...args),
    getInstalledAppVersion: jest.fn(() => '1.0.0'),
    getRemoteAppUpdateRequirement: (...args: unknown[]) => mockGetRemoteAppUpdateRequirement(...args),
    isBuildNumberOlder: jest.fn(),
    isVersionOlder: jest.fn(),
    shouldCheckForMandatoryAppUpdate: jest.fn(() => true),
}))

describe('<AppUpdateGate />', () => {
    beforeEach(() => {
        jest.useFakeTimers()
        mockAppStateListeners.clear()
        mockGetCachedAppUpdateRequirement.mockReset().mockResolvedValue(null)
        mockGetRemoteAppUpdateRequirement.mockReset().mockResolvedValue(null)
        jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
            mockAppStateListeners.add(listener as (state: string) => void)
            return {
                remove: () => mockAppStateListeners.delete(listener as (state: string) => void),
            } as never
        })
    })

    afterEach(() => {
        jest.restoreAllMocks()
        jest.useRealTimers()
    })

    it('keeps the active route mounted while checking again after returning to the foreground', async () => {
        const { getByText } = await render(
            <AppUpdateGate>
                <Text>Login form</Text>
            </AppUpdateGate>
        )

        await act(async () => {
            await jest.advanceTimersByTimeAsync(0)
        })
        expect(getByText('Login form')).toBeTruthy()

        let finishForegroundCheck: (value: null) => void = () => {}
        mockGetRemoteAppUpdateRequirement.mockImplementationOnce(
            () => new Promise((resolve) => {
                finishForegroundCheck = resolve
            })
        )

        act(() => {
            for (const listener of mockAppStateListeners) listener('active')
        })

        // Opening a password manager has this same foreground lifecycle. The
        // current route must stay mounted so its controlled inputs keep value.
        expect(getByText('Login form')).toBeTruthy()

        await act(async () => {
            finishForegroundCheck(null)
        })
    })
})
