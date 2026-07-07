import { router } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { Alert, Pressable, Text, TextInput, View } from 'react-native'

import { useAuth } from '@/features/auth/context/AuthContext'
import { isValidEmail, normalizeEmail } from '@/features/auth/utils/email'
import { useTransientSnackbarStore } from '@/features/feedback/store/useTransientSnackbarStore'
import ProfileSubpageLayout from '@/features/profile/components/ProfileSubpageLayout'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'
import { useTranslation } from '@/localization'
import { createThemedStyles } from '@/styles/createStyles'

export default function EditProfileScreen() {
  const { user, updateEmailAddress, updateProfileName } = useAuth()
  const showSnackbar = useTransientSnackbarStore((state) => state.show)
  const { t } = useTranslation()
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
      Alert.alert(t('profile.editProfile.nameRequiredTitle'), t('profile.editProfile.nameRequiredMessage'))
      return
    }
    if (!normalizedEmail) {
      Alert.alert(t('profile.editProfile.emailRequiredTitle'), t('profile.editProfile.emailRequiredMessage'))
      return
    }
    if (!isValidEmail(normalizedEmail)) {
      Alert.alert(t('profile.editProfile.invalidEmailTitle'), t('profile.editProfile.invalidEmailMessage'))
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
          Alert.alert(
            t('profile.editProfile.emailUpdateRequestedTitle'),
            t('profile.editProfile.emailUpdateRequestedMessage', { email: pendingEmail })
          )
        } else {
          Alert.alert(t('profile.editProfile.updatedTitle'), t('profile.editProfile.updatedMessage'))
        }
      } else {
        showSnackbar(t('profile.editProfile.updatedSnackbar'))
      }
      router.replace(profileRoute)
    } catch (error: any) {
      Alert.alert(t('profile.editProfile.saveFailedTitle'), getUserFacingErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProfileSubpageLayout
      title={t('profile.editProfile.title')}
      onBack={() => router.replace(profileRoute)}
      headerRight={
        <Pressable
          onPress={onSave}
          style={({ pressed }) => [
            styles.saveButton,
            (saving || !name.trim() || !email.trim()) && styles.saveButtonDisabled,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('profile.editProfile.saveA11y')}
          disabled={saving || !name.trim() || !email.trim()}
        >
          <Text style={styles.saveText}>{saving ? t('profile.editProfile.saving') : t('profile.editProfile.save')}</Text>
        </Pressable>
      }
    >

      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>👩‍🍳</Text>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('profile.editProfile.nameLabel')}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('profile.editProfile.namePlaceholder')}
          placeholderTextColor={styles.placeholder.color}
          style={styles.input}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="next"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('profile.editProfile.emailLabel')}</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder={t('profile.editProfile.emailPlaceholder')}
          placeholderTextColor={styles.placeholder.color}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          returnKeyType="done"
          onSubmitEditing={onSave}
        />
      </View>
    </ProfileSubpageLayout>
  )
}

const styles = createThemedStyles((theme) => ({
  content: {
    gap: theme.spacing.xl,
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
    ...theme.textVariants.label,
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
