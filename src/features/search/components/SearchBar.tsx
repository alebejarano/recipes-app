import { Feather } from '@expo/vector-icons';
import React from 'react';
import { TextInput, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
};

export default function SearchBar({ value, onChangeText, placeholder }: Props) {
  return (
    <View style={styles.wrap}>
      <Feather name="search" size={20} style={styles.icon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={styles.placeholder.color}
        style={styles.input}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = createThemedStyles((theme) => ({
  wrap: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    height: 56,
  },
  icon: {
    color: theme.colors.mutedForeground,
    marginRight: theme.spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
    paddingVertical: 0,
  },
  placeholder: {
    color: theme.colors.mutedForeground,
  },
}));
