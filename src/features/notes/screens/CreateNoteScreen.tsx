import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useState } from 'react'
import { ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Button from '@/components/Button'
import { createThemedStyles } from '@/styles/createStyles'

export default function CreateNoteScreen() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const isValid = title.trim().length > 0 || content.trim().length > 0

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Button
            variant="ghost"
            size="md"
            onPress={() => router.back()}
            style={styles.backButton}
            icon={<Feather name="arrow-left" size={16} style={styles.backIcon} />}
          >
            Back
          </Button>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Create a note</Text>
          <Text style={styles.subtitle}>Capture ideas, tips, and quick thoughts.</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Title (optional)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Meal prep ideas"
                placeholderTextColor={styles.placeholder.color}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Note</Text>
            <View style={styles.textAreaWrapper}>
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Write here..."
                placeholderTextColor={styles.placeholder.color}
                multiline
                textAlignVertical="top"
                style={styles.textArea}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            disabled={!isValid}
            size="xl"
            variant="primary"
            onPress={() => router.back()}
          >
            Save Note
          </Button>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = createThemedStyles((theme) => ({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.lg },

  headerRow: { marginBottom: theme.spacing.md },
  backButton: { paddingHorizontal: 0, alignSelf: 'flex-start' },
  backIcon: { color: theme.colors.mutedForeground },

  scroll: { paddingBottom: theme.spacing.xl },

  title: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.display,
    lineHeight: theme.lineHeight.display,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.lg,
  },

  fieldGroup: { marginBottom: theme.spacing.lg },
  label: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
  },

  inputWrapper: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  textAreaWrapper: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 160,
  },

  input: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },
  textArea: {
    flex: 1,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },
  placeholder: { color: theme.colors.mutedForeground },

  footer: { marginTop: theme.spacing.md },
}))
