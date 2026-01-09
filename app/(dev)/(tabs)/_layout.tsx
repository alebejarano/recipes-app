import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createThemedStyles } from '@/styles/createStyles';
import { theme } from '@/styles/theme';

const ICON_SIZE = 22;
const ADD_ICON_SIZE = 28;

// Make the add button size explicit (bigger than 40 looks like your screenshot)
const ADD_BUTTON_SIZE = 58;

const styles = createThemedStyles((t) => ({
  tabBar: {
    backgroundColor: t.colors.background,
    borderTopColor: t.colors.border,
    borderTopWidth: 1,

    // important on Android to avoid weird "floating" / overlap behavior
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,

    paddingTop: 10,
  },

  tabBarLabel: {
    fontSize: t.fontSize.xs,
    fontFamily: t.fontFamily.medium,
    marginTop: 2,
  },

  /**
   * This is the critical fix:
   * The center tab must occupy the SAME flex slot as other tabs,
   * otherwise it will never be perfectly centered.
   */
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  centerButton: {
    width: ADD_BUTTON_SIZE,
    height: ADD_BUTTON_SIZE,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.sage,

    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
}));

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  // Base tab bar height without safe-area.
  const baseHeight = Platform.select({ ios: 64, android: 62 }) ?? 62;

  // Final height includes safe-area bottom so it never overlaps the system UI.
  const tabBarHeight = baseHeight + insets.bottom;

  // Lift the add button above the bar.
  const lift = insets.bottom > 0 ? 22 : 18;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedForeground,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarHideOnKeyboard: true,
        tabBarStyle: [
          styles.tabBar,
          {
            height: tabBarHeight,
            paddingBottom: insets.bottom,
          },
        ],
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
              children,
            } = props;

            return (
              <View style={styles.centerSlot} pointerEvents="box-none">
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={onPress ?? undefined}
                  accessibilityLabel={accessibilityLabel}
                  accessibilityState={accessibilityState}
                  accessibilityRole={accessibilityRole}
                  testID={testID}
                  style={[styles.centerButton, { transform: [{ translateY: -lift }] }]}
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
            <Feather name="search" size={ICON_SIZE} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={ICON_SIZE} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
