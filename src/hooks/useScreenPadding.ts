import { theme } from '@/styles/theme';
import { layout } from '@/styles/layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Options = {
  top?: number;      // extra spacing under the status bar
  bottom?: number;   // extra spacing above bottom safe area
  horizontal?: number;
};

export function useScreenPadding(options: Options = {}) {
  const insets = useSafeAreaInsets();

  const topExtra = options.top ?? theme.spacing.xl;
  const bottomExtra = options.bottom ?? 0;
  const horizontal = options.horizontal ?? layout.screenPadding;

  return {
    paddingTop: insets.top + topExtra,
    paddingBottom: insets.bottom + bottomExtra,
    paddingHorizontal: horizontal,
  };
}
