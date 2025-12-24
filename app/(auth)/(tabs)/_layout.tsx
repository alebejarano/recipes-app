import { Feather } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React from 'react'
import { Platform, TouchableOpacity, View } from 'react-native'

import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

const styles = createThemedStyles((t) => ({
  tabBar: {
    backgroundColor: t.colors.background,
    borderTopColor: t.colors.border,
    borderTopWidth: 1,
    height: Platform.select({ ios: 84, android: 74 }),
    paddingTop: 10,
    paddingBottom: Platform.select({ ios: 22, android: 12 }),
  },

  tabBarLabel: {
    fontSize: t.fontSize.xs,
    fontFamily: t.fontFamily.medium,
  },

  centerButtonWrap: {
    flex: 1,
    alignItems: 'center',
  },

  centerButton: {
    width: 58,
    height: 58,
    marginTop: -18,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.primary,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
}))

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
            tabBarIcon: ({ color, size }) => (
                <Feather name="home" size={size ?? 22} color={color} />
            ),
            }}
        />

        <Tabs.Screen
            name="folders"
            options={{
            title: 'Folders',
            tabBarIcon: ({ color, size }) => (
                <Feather name="folder" size={size ?? 22} color={color} />
            ),
            }}
        />

        {/* ✅ THIS IS WHERE THE FIX GOES */}
        <Tabs.Screen
            name="add-recipe"
            options={{
            title: '',
            tabBarLabel: () => null,
            tabBarIcon: ({ size }) => (
            <Feather
                name="plus"
                size={(size ?? 22) + 2}
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
            } = props

            return (
                <View style={styles.centerButtonWrap} pointerEvents="box-none">
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={onPress ?? undefined} // normalize possible null
                    accessibilityLabel={accessibilityLabel}
                    accessibilityState={accessibilityState}
                    accessibilityRole={accessibilityRole}
                    testID={testID}
                    style={[styles.centerButton, style]}
                >
                    {children}
                </TouchableOpacity>
                </View>
            )
        },
    }}
/>


        <Tabs.Screen
        name="notes"
        options={{
            title: 'Notes',
            tabBarIcon: ({ color, size }) => (
            <Feather name="file-text" size={size ?? 22} color={color} />
            ),
        }}
        />

        <Tabs.Screen
        name="settings"
        options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
            <Feather name="settings" size={size ?? 22} color={color} />
            ),
        }}
        />
        </Tabs>
    )
}
