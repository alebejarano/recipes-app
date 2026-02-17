import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { Alert, Pressable, Text, TextInput, View } from 'react-native'

import Screen from '@/components/Screen'
import { useAuth } from '@/features/auth/context/AuthContext'
import { isValidEmail, normalizeEmail } from '@/features/auth/utils/email'
import { createThemedStyles } from '@/styles/createStyles'

export default function EditProfileScreen() {
  const { user, updateEmailAddress, updateProfileName } = useAuth()
  const initialName = useMemo(() => {
    const metadataName = user?.user_metadata?.display_name
    if (typeof metadataName === 'string' && metadataName.trim()) return metadataName.trim()
    const email = user?.email ?? ''
    return email ? (email.split('@')[0] || '') : ''
  }, [user?.email, user?.user_metadata?.display_name])
  const initialEmail = useMemo(() => user?.new_email ?? user?.email ?? '', [user?.email, user?.new_email])

  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [saving, setSaving] = useState(false)
  const profileRoute = '/(auth)/(tabs)/profile'

  const onSave = async () => {
    const trimmedName = name.trim()
    const normalizedEmail = normalizeEmail(email)

    if (!trimmedName) {
      Alert.alert('Name required', 'Please enter your name.')
      return
    }
    if (!normalizedEmail) {
      Alert.alert('Email required', 'Please enter your email.')
      return
    }
    if (!isValidEmail(normalizedEmail)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.')
      return
    }

    const nameChanged = trimmedName !== initialName
    const emailChanged = normalizedEmail !== normalizeEmail(initialEmail)
    if (!nameChanged && !emailChanged) {
      router.replace(profileRoute)
      return
    }

    setSaving(true)
    try {
      if (nameChanged) {
        await updateProfileName(trimmedName)
      }
      if (emailChanged) {
        const { pendingEmail } = await updateEmailAddress(normalizedEmail)
        if (pendingEmail) {
          Alert.alert('Email update requested', `Check your inbox at ${pendingEmail} to confirm this email change.`)
        } else {
          Alert.alert('Profile updated', 'Your email has been updated.')
        }
      }
      router.replace(profileRoute)
    } catch (error: any) {
      Alert.alert('Unable to save profile', error?.message ?? 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen scroll={false} contentStyle={styles.content}>
      <View style={styles.topRow}>
        <Pressable
          onPress={() => router.replace(profileRoute)}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={18} style={styles.icon} />
        </Pressable>

        <Text style={styles.title}>Edit Profile</Text>

        <Pressable
          onPress={onSave}
          style={({ pressed }) => [
            styles.saveButton,
            (saving || !name.trim() || !email.trim()) && styles.saveButtonDisabled,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Save profile"
          disabled={saving || !name.trim() || !email.trim()}
        >
          <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
        </Pressable>
      </View>

      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>👩‍🍳</Text>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={styles.placeholder.color}
          style={styles.input}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="next"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={styles.placeholder.color}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          returnKeyType="done"
          onSubmitEditing={onSave}
        />
      </View>
    </Screen>
  )
}

const styles = createThemedStyles((theme) => ({
  content: {
    gap: theme.spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.creamDark,
  },
  icon: {
    color: theme.colors.foreground,
  },
  title: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xxl,
    lineHeight: theme.lineHeight.xxl,
    color: theme.colors.foreground,
  },
  saveButton: {
    minWidth: 72,
    height: 44,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.primaryForeground,
  },
  avatarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: theme.radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    ...theme.shadows.soft,
  },
  avatarEmoji: {
    fontSize: 38,
  },
  field: {
    gap: theme.spacing.xs,
  },
  label: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.mutedForeground,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
    color: theme.colors.foreground,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
  },
  placeholder: {
    color: theme.colors.mutedForeground,
  },
  pressed: {
    opacity: 0.85,
  },
}))
