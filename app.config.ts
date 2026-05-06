import type { ExpoConfig } from 'expo/config'

type AppEnv = 'development' | 'preview' | 'production'

function resolveAppEnv(): AppEnv {
  const raw = (process.env.EXPO_PUBLIC_APP_ENV ?? '').trim().toLowerCase()
  if (raw === 'production') return 'production'
  if (raw === 'preview') return 'preview'
  return 'development'
}

const appEnv = resolveAppEnv()

const config: ExpoConfig = {
  name: 'Dropsauce',
  slug: 'dropsauce',
  owner: 'lejitas',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'recipesapp',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    infoPlist: {
      NSPhotoLibraryUsageDescription: 'Allow access to your photo library to add recipe images.',
      NSPhotoLibraryAddUsageDescription: 'Allow saving recipe images to your photo library.',
      NSCameraUsageDescription: 'Allow access to your camera to take recipe photos.',
    },
  },
  android: {
    softwareKeyboardLayoutMode: 'resize',
    permissions: [
      'CAMERA',
      'READ_MEDIA_IMAGES',
      'READ_EXTERNAL_STORAGE',
      'CAMERA',
      'READ_MEDIA_IMAGES',
      'READ_EXTERNAL_STORAGE',
    ],
    adaptiveIcon: {
      backgroundColor: '#F7F1E8',
      foregroundImage: './assets/images/android-icon-foreground.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: 'com.anonymous.recipesapp',
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-web-browser',
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#f7f1e8',
        dark: {
          backgroundColor: '#3b332b',
        },
      },
    ],
    'expo-font',
    'expo-secure-store',
    'expo-localization',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    appEnv,
    eas: {
      projectId: '915e1a2c-c53f-4768-90d5-6774b0589f7a',
    },
  },
}

export default config
