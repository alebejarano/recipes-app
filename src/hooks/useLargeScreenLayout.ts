import { useMemo } from 'react'
import { useWindowDimensions, type ViewStyle } from 'react-native'

import { layout } from '@/styles/layout'

type Options = {
  maxContentWidth?: number
}

export function useLargeScreenLayout(options: Options = {}) {
  const { width } = useWindowDimensions()
  const isLargeScreen = width >= layout.largeScreenMinWidth
  const maxContentWidth = options.maxContentWidth ?? layout.formContentMaxWidth

  return useMemo(() => {
    const pagePaddingStyle: ViewStyle = {
      paddingHorizontal: isLargeScreen ? layout.largeScreenPadding : layout.screenPadding,
    }

    const contentWidthStyle: ViewStyle = {
      width: '100%',
      maxWidth: isLargeScreen ? maxContentWidth : undefined,
      alignSelf: 'center',
    }

    return {
      isLargeScreen,
      pagePaddingStyle,
      contentWidthStyle,
    }
  }, [isLargeScreen, maxContentWidth])
}
