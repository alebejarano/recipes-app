import { render } from '@testing-library/react-native'

import RecentActivityList from '@/features/home/components/RecentActivityList'
import type { HomeActivityItem } from '@/features/home/utils/homeState'

jest.mock('@/localization', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe('<RecentActivityList />', () => {
  it('does not render unsupported activity types', async () => {
    const items = [
      {
        id: 'note:1',
        type: 'note',
        title: 'Supported note',
        timestamp: '2026-08-01T12:00:00.000Z',
        destination: 'note',
      },
      {
        id: 'unsupported:1',
        type: 'unsupported',
        title: 'Unsupported activity',
        timestamp: '2026-08-02T12:00:00.000Z',
        destination: 'recipe',
      },
    ] as unknown as HomeActivityItem[]

    const { getByText, queryByText } = await render(
      <RecentActivityList items={items} formatMeta={() => ''} onPressItem={jest.fn()} />,
    )

    expect(getByText('Supported note')).toBeVisible()
    expect(queryByText('Unsupported activity')).toBeNull()
  })
})
