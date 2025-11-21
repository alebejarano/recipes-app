import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, iconSize } from '../constants/theme';
import React from "react";

export default function Layout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.bg,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    paddingTop: 8,
                    paddingBottom: insets.bottom + 12,
                    height: 60 + insets.bottom + 20,
                },
                tabBarActiveTintColor: colors.accent,
                tabBarInactiveTintColor: colors.secondaryMutedText,
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Recipes',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="book" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="notes"
                options={{
                    title: 'Notes',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="document-text" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="add"
                options={{
                    title: 'Add',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="add" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="ingredients"
                options={{
                    title: 'Ingredients',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="nutrition" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="settings" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="recipe/[id]"
                options={{
                    href: null, // Hide from tab bar
                }}
            />
        </Tabs>
    );
}
