import { theme } from '@/styles/theme';
import { getResponsiveScreenPadding } from '@/styles/layout';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Options = {
  top?: number;      // extra spacing under the status bar
  bottom?: number;   // extra spacing above bottom safe area
  horizontal?: number;
};

export function useScreenPadding(options: Options = {}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const topExtra = options.top ?? theme.spacing.xl;
  const bottomExtra = options.bottom ?? 0;
  const defaultHorizontal = getResponsiveScreenPadding(width);
  const horizontal = options.horizontal ?? defaultHorizontal;

  return {
    paddingTop: insets.top + topExtra,
    paddingBottom: insets.bottom + bottomExtra,
    paddingHorizontal: horizontal,
  };
}
