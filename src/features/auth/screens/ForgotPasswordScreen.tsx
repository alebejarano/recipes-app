// src/features/auth/screens/ForgotPasswordScreen.tsx

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import Button from '@/components/Button';
import { createThemedStyles } from '@/styles/createStyles';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = () => {
        if (!email) {
            console.warn('Email required');
            return;
        }

        setSubmitting(true);

        // TODO: call your backend reset endpoint
        setTimeout(() => {
            setSubmitting(false);
            setSent(true);
        }, 1000);
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
                    {/* Back */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backRow}
                    >
                        <Feather name="arrow-left" size={18} style={styles.backIcon} />
                        <Text style={styles.backText}>Back</Text>
                    </TouchableOpacity>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconWrapper}>
                            <Feather
                                name="mail"
                                size={24}
                                style={styles.icon}
                            />
                        </View>

                        <Text style={styles.title}>Forgot password?</Text>
                        <Text style={styles.subtitle}>
                            Enter the email you use for your account and we’ll send you a
                            link to reset your password.
                        </Text>
                    </View>

                    {/* Email field */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Email</Text>

                        <View style={styles.inputWrapper}>
                            <Feather name="mail" size={18} style={styles.inputIcon} />
                            <TextInput
                                placeholder="you@example.com"
                                placeholderTextColor="#8c857b"
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="email-address"
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>
                    </View>

                    <Button
                        onPress={handleSubmit}
                        disabled={submitting}
                        size="lg"
                        style={styles.submitButton}
                        textStyle={styles.submitButtonText}
                    >
                        {submitting ? 'Sending...' : 'Send reset link'}
                    </Button>

                    {sent && (
                        <Text style={styles.infoText}>
                            If an account exists with this email, you’ll receive a reset link
                            in a few minutes.
                        </Text>
                    )}
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

    backRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    backIcon: {
        color: theme.colors.warmGray,
        marginRight: theme.spacing.xs,
    },
    backText: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.sm,
        color: theme.colors.warmGray,
    },

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
    icon: {
        color: theme.colors.sage,
    },
    title: {
        fontFamily: theme.fontFamily.semibold,
        fontSize: theme.fontSize.display,
        color: theme.colors.foreground,
        marginBottom: theme.spacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.sm,
        lineHeight: theme.lineHeight.base,
        color: theme.colors.mutedForeground,
        textAlign: 'center',
    },

    field: {
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
    },
    label: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.sm,
        color: theme.colors.foreground,
        marginBottom: theme.spacing.xs,
    },
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

    submitButton: {
        width: '100%',
        borderRadius: 999,
        backgroundColor: theme.colors.primary,
    },
    submitButtonText: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.base,
        color: theme.colors.primaryForeground,
    },

    infoText: {
        marginTop: theme.spacing.lg,
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.xs,
        lineHeight: theme.lineHeight.sm,
        color: theme.colors.mutedForeground,
        textAlign: 'center',
    },
}));
