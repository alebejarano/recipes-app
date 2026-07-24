import { Feather } from '@expo/vector-icons'
import { router, useSegments } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'

import { getFaqSections } from '@/features/help/content/faq'
import ProfileSubpageLayout from '@/features/profile/components/ProfileSubpageLayout'
import { useTranslation } from '@/localization'
import { createThemedStyles } from '@/styles/createStyles'

export default function FaqScreen() {
  const { locale, t } = useTranslation()
  const segments = useSegments()
  const routeMode = segments[0] === '(public)' ? 'public' : 'auth'

  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const faqSections = useMemo(() => getFaqSections(locale), [locale])

  const filteredSections = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return faqSections

    return faqSections.map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const inQuestion = item.question.toLowerCase().includes(normalized)
        const inAnswers = item.answers.some((answer) => answer.toLowerCase().includes(normalized))
        return inQuestion || inAnswers
      }),
    })).filter((section) => section.items.length > 0)
  }, [faqSections, query])

  const onPressBack = () => {
    if (routeMode === 'public') {
      router.replace('/(public)/(tabs)/profile')
      return
    }

    router.replace('/(auth)/(tabs)/profile')
  }

  return (
    <ProfileSubpageLayout title={t('profile.faq.title')} subtitle={t('profile.faq.subtitle')} onBack={onPressBack}>
      <View style={styles.content}>
        <View style={styles.searchWrap}>
          <Feather name="search" size={20} style={styles.searchIcon} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('profile.faq.searchPlaceholder')}
            placeholderTextColor={styles.placeholder.color}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>

        {filteredSections.map((section) => (
          <View key={section.id} style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>{section.title}</Text>

            <View style={styles.card}>
              {section.items.map((item, index) => {
                const isOpen = openId === item.id

                return (
                  <View
                    key={item.id}
                    style={[styles.itemWrap, index !== section.items.length - 1 && styles.itemDivider]}
                  >
                    <Pressable
                      onPress={() => setOpenId((prev) => (prev === item.id ? null : item.id))}
                      style={({ pressed }) => [styles.questionRow, pressed && styles.questionPressed]}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: isOpen }}
                      accessibilityLabel={item.question}
                    >
                      <Text style={styles.question}>{item.question}</Text>
                      <Feather name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} style={styles.chevron} />
                    </Pressable>

                    {isOpen ? (
                      <View style={styles.answersWrap}>
                        {item.answers.map((answer, answerIndex) => (
                          <Text key={`${item.id}-${answerIndex}`} style={styles.answer}>
                            {answer}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                  </View>
                )
              })}
            </View>
          </View>
        ))}

        <View style={styles.supportCard}>
          <Text style={styles.supportTitle}>{t('profile.faq.supportTitle')}</Text>
          <Text style={styles.supportBody}>{t('profile.faq.supportBody')}</Text>
          <Text style={styles.supportEmail}>hello@dropsauce.app</Text>
        </View>
      </View>
    </ProfileSubpageLayout>
  )
}

const styles = createThemedStyles((theme) => ({
  content: {
    gap: theme.spacing.lg,
  },
  searchWrap: {
    height: 52,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.creamDark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  searchIcon: {
    color: theme.colors.mutedForeground,
  },
  searchInput: {
    flex: 1,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
  placeholder: {
    color: theme.colors.mutedForeground,
  },
  sectionWrap: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.textVariants.emphasis,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: theme.colors.warmGray,
  },
  card: {
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  itemWrap: {
    backgroundColor: theme.colors.background,
  },
  itemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  questionRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  chevron: {
    color: theme.colors.mutedForeground,
  },
  answersWrap: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  question: {
    flex: 1,
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.foreground,
  },
  answer: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.mutedForeground,
  },
  pressed: {
    opacity: 0.8,
  },
  questionPressed: {
    opacity: 0.75,
  },
  supportCard: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing['2xl'],
    gap: theme.spacing.md,
  },
  supportTitle: {
    ...theme.textVariants.heading,
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  supportBody: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
  supportEmail: {
    marginTop: theme.spacing.xs,
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.primary,
    textAlign: 'center',
  },
}))
