import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, iconSize } from '../constants/theme';

export default function Layout() {
  return (
      <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: colors.bg,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              height: 70,
              paddingBottom: 10,
              paddingTop: 10,
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
            name="ingredients"
            options={{
              title: 'Ingredients',
              tabBarIcon: ({ color, size }) => (
                  <Ionicons name="nutrition" size={size} color={color} />
              ),
            }}
        />
      </Tabs>
  );
}
