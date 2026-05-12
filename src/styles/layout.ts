import { spacing } from './spacing'

export const layout = {
    screenPadding: spacing.lg,
    largeScreenMinWidth: 1024,
    largeScreenPadding: spacing['4xl'] * 2,
    authContentMaxWidth: 480,
    formContentMaxWidth: 760,
    sectionGap: spacing['2xl'],
    cardPadding: spacing.lg,
    cardGap: spacing.md,
    listGap: spacing.sm,
} as const
