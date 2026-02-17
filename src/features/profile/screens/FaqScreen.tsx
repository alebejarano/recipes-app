import { Feather } from '@expo/vector-icons'
import { router, useSegments } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { Alert, Pressable, Text, TextInput, View } from 'react-native'

import Screen from '@/components/Screen'
import { FAQ_SECTIONS } from '@/features/help/content/faq'
import { createThemedStyles } from '@/styles/createStyles'

export default function FaqScreen() {
  const segments = useSegments()
  const routeMode = segments[0] === '(dev)' ? 'dev' : segments[0] === '(public)' ? 'public' : 'auth'

  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const filteredSections = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return FAQ_SECTIONS

    return FAQ_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const inQuestion = item.question.toLowerCase().includes(normalized)
        const inAnswers = item.answers.some((answer) => answer.toLowerCase().includes(normalized))
        return inQuestion || inAnswers
      }),
    })).filter((section) => section.items.length > 0)
  }, [query])

  const onPressBack = () => {
    if (router.canGoBack()) {
      router.back()
      return
    }

    if (routeMode === 'dev') {
      router.replace('/(dev)/(tabs)/profile')
      return
    }

    if (routeMode === 'public') {
      router.replace('/(public)/(tabs)/profile')
      return
    }

    router.replace('/(auth)/(tabs)/profile')
  }

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.headerWrap}>
        <Pressable
          onPress={onPressBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={22} style={styles.backIcon} />
        </Pressable>

        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Help Center</Text>
          <Text style={styles.subtitle}>Find answers quickly</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={20} style={styles.searchIcon} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search questions..."
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
        <Text style={styles.supportTitle}>Still need help?</Text>
        <Text style={styles.supportBody}>Our support team usually replies within a few hours.</Text>

        <Pressable
          onPress={() => Alert.alert('Contact Support', 'Support contact will be available soon.')}
          style={({ pressed }) => [styles.supportButton, pressed && styles.questionPressed]}
          accessibilityRole="button"
          accessibilityLabel="Contact support"
        >
          <Text style={styles.supportButtonText}>Contact Support</Text>
        </Pressable>
      </View>
    </Screen>
  )
}

const styles = createThemedStyles((theme) => ({
  content: {
    gap: theme.spacing.lg,
  },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.creamDark,
  },
  backIcon: {
    color: theme.colors.foreground,
  },
  headerTextWrap: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  title: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.display,
    lineHeight: theme.lineHeight.display,
    color: theme.colors.foreground,
  },
  subtitle: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.mutedForeground,
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
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
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
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xxl,
    lineHeight: theme.lineHeight.xxl,
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
  supportButton: {
    marginTop: theme.spacing.xs,
    minHeight: 54,
    minWidth: 220,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  supportButtonText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.xxl,
    lineHeight: theme.lineHeight.xxl,
    color: theme.colors.primaryForeground,
  },
}))
