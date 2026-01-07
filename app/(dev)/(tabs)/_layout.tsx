import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, TouchableOpacity, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';
import { theme } from '@/styles/theme';

const ICON_SIZE = 22;
const ADD_ICON_SIZE = 28;

const styles = createThemedStyles((theme) => ({
  tabBar: {
    backgroundColor: theme.colors.background,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    height: Platform.select({ ios: 84, android: 74 }),
    paddingTop: 10,
    paddingBottom: Platform.select({ ios: 22, android: 12 }),
  },

  tabBarLabel: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fontFamily.medium,
  },

  centerButtonWrap: {
    width: 40,
    height: 40,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.sage
  },

  centerButton: {
    alignItems: "center",
    justifyContent: "center",
  },
}));

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedForeground,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={ICON_SIZE} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="collections"
        options={{
          title: 'Collections',
          tabBarIcon: ({ color }) => (
            <Feather name="folder" size={ICON_SIZE} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="add-recipe"
        options={{
          title: '',
          tabBarLabel: () => null,
          tabBarIcon: () => (
            <Feather
              name="plus"
              size={ADD_ICON_SIZE}
              color={theme.colors.primaryForeground}
            />
          ),
          tabBarButton: (props) => {
            const {
              onPress,
              accessibilityLabel,
              accessibilityState,
              accessibilityRole,
              testID,
              style,
              children,
            } = props;

            return (
              <View style={styles.centerButtonWrap} pointerEvents="box-none">
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={onPress ?? undefined}
                  accessibilityLabel={accessibilityLabel}
                  accessibilityState={accessibilityState}
                  accessibilityRole={accessibilityRole}
                  testID={testID}
                  style={[styles.centerButton, style]}
                >
                  {children}
                </TouchableOpacity>
              </View>
            );
          },
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => (
            <Feather name="file-text" size={ICON_SIZE} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Feather name="settings" size={ICON_SIZE} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
