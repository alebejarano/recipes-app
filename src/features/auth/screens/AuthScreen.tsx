// src/features/auth/screens/AuthScreen.tsx

import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import OAuthButtons from '@/features/auth/components/OAuthButtons';
import { useAuth } from '@/features/auth/context/AuthContext';
import { createThemedStyles } from '@/styles/createStyles';

export type AuthMode = 'login' | 'register';

type AuthScreenProps = {
    initialMode: AuthMode;
};

export default function AuthScreen({ initialMode }: AuthScreenProps) {
    const router = useRouter();
    const { login, register } = useAuth();


    const [mode, setMode] = useState<AuthMode>(initialMode);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const isLogin = mode === 'login';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !confirmPassword)) return;

    if (!isLogin && password !== confirmPassword) return;

    setLoading(true);

    try {
        if (isLogin) {
        await login(email, password);
        } else {
        await register(email, password);
        }

        router.replace('/(auth)/(tabs)');
    } finally {
        setLoading(false);
    }
    };


    const handleForgotPassword = () => {
        router.push('/forgot-password');
    };

    const handleAppleAuth = () => {
        // TODO: integrate Sign in with Apple
        console.log('Apple auth');
    };

    const handleGoogleAuth = () => {
        // TODO: integrate Google auth
        console.log('Google auth');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconWrapper}>
                            <Text style={styles.emoji}>🍳</Text>
                        </View>

                        <Text style={styles.title}>
                            {isLogin ? 'Welcome back' : 'Create account'}
                        </Text>

                        <Text style={styles.subtitle}>
                            {isLogin
                                ? 'Sign in to access your recipes'
                                : 'Start organizing your recipes today'}
                        </Text>
                    </View>

                    {/* Email */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Email</Text>
                        <View style={styles.inputWrapper}>
                            <Feather name="mail" size={18} style={styles.inputIcon} />
                            <TextInput
                                placeholder="you@example.com"
                                placeholderTextColor="#8c857b"
                                autoCapitalize="none"
                                autoCorrect={false}
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>
                    </View>

                    {/* Password */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Password</Text>

                        <View style={styles.inputWrapper}>
                            <Feather name="lock" size={18} style={styles.inputIcon} />

                            <TextInput
                                placeholder="••••••••"
                                placeholderTextColor="#8c857b"
                                secureTextEntry={!showPassword}
                                style={styles.input}
                                value={password}
                                onChangeText={setPassword}
                            />

                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeButton}
                            >
                                <Feather
                                    name={showPassword ? 'eye-off' : 'eye'}
                                    size={18}
                                    style={styles.eyeIcon}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Confirm Password (register only) */}
                    {!isLogin && (
                        <View style={styles.field}>
                            <Text style={styles.label}>Confirm Password</Text>

                            <View style={styles.inputWrapper}>
                                <Feather name="lock" size={18} style={styles.inputIcon} />

                                <TextInput
                                    placeholder="••••••••"
                                    placeholderTextColor="#8c857b"
                                    secureTextEntry={!showPassword}
                                    style={styles.input}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                            </View>
                        </View>
                    )}

                    {/* Forgot password — login only */}
                    {isLogin && (
                        <TouchableOpacity
                            style={styles.forgotRow}
                            onPress={handleForgotPassword}
                        >
                            <Text style={styles.forgotText}>Forgot password?</Text>
                        </TouchableOpacity>
                    )}

                    {/* Submit button */}
                    <Button
                        onPress={handleSubmit}
                        disabled={loading}
                        size="lg"
                        style={styles.submitButton}
                        textStyle={styles.submitButtonText}
                    >
                        {loading ? '...' : isLogin ? 'Sign in' : 'Create account'}
                    </Button>

                    {/* Toggle login/register */}
                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleText}>
                            {isLogin
                                ? "Don't have an account? "
                                : 'Already have an account? '}
                        </Text>

                        <TouchableOpacity
                            onPress={() => setMode(isLogin ? 'register' : 'login')}
                        >
                            <Text style={styles.toggleAction}>
                                {isLogin ? 'Sign up' : 'Sign in'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* OAuth block */}
                    <OAuthButtons
                        onApplePress={handleAppleAuth}
                        onGooglePress={handleGoogleAuth}
                    />

                    <TouchableOpacity
                        onPress={() => router.replace('/get-started')}
                        style={styles.notNowLink}
                    >
                    <Text
                        style={styles.notNowText}>
                        Not now
                    </Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = createThemedStyles(theme => ({
    flex: { flex: 1 },

    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },

    content: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.xl,
    },

    /* Header */
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    iconWrapper: {
        width: 64,
        height: 64,
        borderRadius: theme.radii.xl,
        backgroundColor: theme.colors.sageLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.md,
    },
    emoji: {
        fontSize: 28,
    },
    title: {
        fontFamily: theme.fontFamily.semibold,
        fontSize: theme.fontSize.display,
        color: theme.colors.foreground,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.sm,
        lineHeight: theme.lineHeight.base,
        color: theme.colors.mutedForeground,
        textAlign: 'center',
    },

    /* Field */
    field: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.sm,
        marginBottom: theme.spacing.xs,
        color: theme.colors.foreground,
    },

    /* Input wrapper */
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: theme.radii.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.inputBackground,
        height: 52,
        paddingHorizontal: theme.spacing.md,
    },
    inputIcon: {
        color: theme.colors.mutedForeground,
        marginRight: theme.spacing.sm,
    },
    input: {
        flex: 1,
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.base,
        color: theme.colors.foreground,
    },
    eyeButton: {
        paddingHorizontal: theme.spacing.xs,
    },
    eyeIcon: {
        color: theme.colors.mutedForeground,
    },

    /* Forgot */
    forgotRow: {
        alignItems: 'flex-end',
        marginBottom: theme.spacing.md,
    },
    forgotText: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.sm,
        color: theme.colors.sage,
    },

    /* Button */
    submitButton: {
        width: '100%',
        borderRadius: 999,
        backgroundColor: theme.colors.primary,
        marginTop: theme.spacing.md,
    },
    submitButtonText: {
        color: theme.colors.primaryForeground,
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.base,
    },

    /* Toggle */
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: theme.spacing.lg,
    },
    toggleText: {
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.sm,
        color: theme.colors.mutedForeground,
    },
    toggleAction: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.sm,
        color: theme.colors.sage,
    },

    /* not now text*/
    notNowLink: {
        marginTop: 24, 
        alignSelf: 'center',
    },
    notNowText: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.sm,
        color: theme.colors.mutedForeground,
    },
}));

export class RegisterMethod {
}
