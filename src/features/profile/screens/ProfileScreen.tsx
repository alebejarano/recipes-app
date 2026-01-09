// src/features/profile/screens/ProfileScreen.tsx
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';

type ProfileScreenProps = {
  onEditProfile?: () => void;
  onSettings?: () => void;
  onLogout?: () => void;
};

export default function ProfileScreen({
  onEditProfile,
  onSettings,
  onLogout,
}: ProfileScreenProps) {
  // Replace with your auth user later
  const user = {
    name: 'Anthony',
    email: 'anthony@example.com',
  };

  const stats = [
    { label: 'Recipes', value: 12 },
    { label: 'Collections', value: 3 },
    { label: 'Notes', value: 8 },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Feather name="user" size={22} style={styles.avatarIcon} />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onEditProfile}
          style={styles.editButton}
        >
          <Feather name="edit-3" size={16} style={styles.editIcon} />
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {stats.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Section: Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <RowItem
          label="Edit profile"
          icon="user"
          onPress={onEditProfile}
        />
        <RowItem
          label="Settings"
          icon="settings"
          onPress={onSettings}
        />
      </View>

      {/* Section: Danger */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger zone</Text>

        <RowItem
          label="Log out"
          icon="log-out"
          onPress={onLogout}
          isDanger
        />
      </View>
    </View>
  );
}

function RowItem({
  label,
  icon,
  onPress,
  isDanger = false,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  onPress?: () => void;
  isDanger?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.rowItem, isDanger && styles.rowItemDanger]}
    >
      <View style={[styles.rowIconWrap, isDanger && styles.rowIconWrapDanger]}>
        <Feather
          name={icon}
          size={18}
          style={[styles.rowIcon, isDanger && styles.rowIconDanger]}
        />
      </View>

      <Text style={[styles.rowLabel, isDanger && styles.rowLabelDanger]}>
        {label}
      </Text>

      <Feather
        name="chevron-right"
        size={18}
        style={[styles.chevron, isDanger && styles.rowIconDanger]}
      />
    </TouchableOpacity>
  );
}

const styles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },

  /* Header card */
  headerCard: {
    width: '100%',
    borderRadius: theme.radii.xxl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  avatarIcon: {
    color: theme.colors.mutedForeground,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.foreground,
  },
  email: {
    marginTop: theme.spacing.xs,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.sageLight,
  },
  editIcon: {
    color: theme.colors.sageDark,
    marginRight: theme.spacing.xs,
  },
  editText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.sageDark,
  },

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xxl,
    lineHeight: theme.lineHeight.xxl,
    color: theme.colors.foreground,
  },
  statLabel: {
    marginTop: theme.spacing.xs,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },

  /* Sections */
  section: {
    marginTop: theme.spacing.xl,
  },
  sectionTitle: {
    marginBottom: theme.spacing.sm,
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },

  /* Row item */
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  rowItemDanger: {
    borderColor: theme.colors.destructive,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  rowIconWrapDanger: {
    backgroundColor: theme.colors.terracottaLight,
  },
  rowIcon: {
    color: theme.colors.primary,
  },
  rowIconDanger: {
    color: theme.colors.destructive,
  },
  rowLabel: {
    flex: 1,
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },
  rowLabelDanger: {
    color: theme.colors.destructive,
  },
  chevron: {
    color: theme.colors.mutedForeground,
  },
}));
