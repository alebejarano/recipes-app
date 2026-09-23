import { spacing } from './spacing'

export const layout = {
    screenPadding: spacing.lg,
    mediumScreenMinWidth: 600,
    mediumScreenPadding: spacing['2xl'],
    largeScreenMinWidth: 1024,
    largeScreenPadding: spacing['4xl'] * 2,
    authContentMaxWidth: 480,
    formContentMaxWidth: 760,
    sectionGap: spacing['2xl'],
    cardPadding: spacing.lg,
    cardGap: spacing.md,
    listGap: spacing.sm,
} as const

export function getResponsiveScreenPadding(width: number) {
    if (width >= layout.largeScreenMinWidth) return layout.largeScreenPadding
    if (width >= layout.mediumScreenMinWidth) return layout.mediumScreenPadding
    return layout.screenPadding
}
