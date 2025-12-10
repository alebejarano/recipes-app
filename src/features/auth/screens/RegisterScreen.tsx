// src/features/auth/screens/RegisterScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';

import Button from '@/components/Button';
import { createThemedStyles } from '@/styles/createStyles';
import accountCloudIllustration from '@assets/illustrations/account-cloud.png';

export type RegisterMethod = 'apple' | 'google' | 'email';

interface RegisterScreenProps {
    onContinue: (method: RegisterMethod) => void;
    showSuccessMessage?: boolean;
}

const benefits = [
    {
        id: 'sync',
        text: 'Sync across all devices',
        icon: (style: any) => (
            <Ionicons name="cloud-outline" size={18} style={style} />
        ),
    },
    {
        id: 'backup',
        text: 'Your recipes, always backed up',
        icon: (style: any) => (
            <Ionicons name="shield-checkmark-outline" size={18} style={style} />
        ),
    },
    {
        id: 'anywhere',
        text: 'Access anywhere, anytime',
        icon: (style: any) => (
            <Ionicons name="phone-portrait-outline" size={18} style={style} />
        ),
    },
];

export default function RegisterScreen({
                                           onContinue,
                                           showSuccessMessage = false,
                                       }: RegisterScreenProps) {
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleEmailSubmit = () => {
        setError(null);

        if (!email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Backend integration will go here later
        onContinue('email');
    };

    const resetEmailFormState = () => {
        setShowEmailForm(false);
        setError(null);
        // You can also clear fields if you prefer:
        // setEmail('');
        // setPassword('');
        // setConfirmPassword('');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.card}>
                        {!showEmailForm ? (
                            <>
                                {/* Success indicator when coming from recipe save */}
                                {showSuccessMessage && (
                                    <View style={styles.successRow}>
                                        <View style={styles.successIconWrapper}>
                                            <Feather
                                                name="check"
                                                size={14}
                                                style={styles.successIcon}
                                            />
                                        </View>
                                        <Text style={styles.successText}>
                                            Recipe saved successfully!
                                        </Text>
                                    </View>
                                )}

                                {/* Illustration + title */}
                                <View style={styles.header}>
                                    <View style={styles.illustrationWrapper}>
                                        <Image
                                            source={accountCloudIllustration}
                                            style={styles.illustration}
                                            resizeMode="cover"
                                        />
                                    </View>
                                    <Text style={styles.title}>
                                        {showSuccessMessage
                                            ? 'Keep your recipes safe'
                                            : 'Save your recipes'}
                                    </Text>
                                    <Text style={styles.subtitle}>
                                        {showSuccessMessage
                                            ? 'Create your free account so you never lose them.'
                                            : 'Create your free account to keep everything synced.'}
                                    </Text>
                                </View>

                                {/* Benefits */}
                                <View style={styles.benefitsList}>
                                    {benefits.map(benefit => (
                                        <View key={benefit.id} style={styles.benefitRow}>
                                            <View style={styles.benefitIconWrapper}>
                                                {benefit.icon(styles.benefitIcon)}
                                            </View>
                                            <Text style={styles.benefitText}>{benefit.text}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Auth buttons */}
                                <View style={styles.buttons}>
                                    <Button
                                        onPress={() => onContinue('apple')}
                                        variant="secondary"
                                        size="lg"
                                        style={styles.oauthButton}
                                        textStyle={styles.oauthButtonText}
                                        icon={
                                            <Ionicons
                                                name="logo-apple"
                                                size={20}
                                                style={styles.oauthIcon}
                                            />
                                        }
                                    >
                                        Continue with Apple
                                    </Button>

                                    <Button
                                        onPress={() => onContinue('google')}
                                        variant="secondary"
                                        size="lg"
                                        style={styles.oauthButton}
                                        textStyle={styles.oauthButtonText}
                                        icon={
                                            <Ionicons
                                                name="logo-google"
                                                size={20}
                                                style={styles.oauthIcon}
                                            />
                                        }
                                    >
                                        Continue with Google
                                    </Button>

                                    <Button
                                        onPress={() => setShowEmailForm(true)}
                                        variant="soft"
                                        size="lg"
                                        style={styles.emailButton}
                                        textStyle={styles.emailButtonText}
                                    >
                                        Continue with Email
                                    </Button>
                                </View>

                                <Text style={styles.termsText}>
                                    By continuing, you agree to our Terms of Service and Privacy
                                    Policy.
                                </Text>
                            </>
                        ) : (
                            <>
                                {/* Back button */}
                                <TouchableOpacity
                                    onPress={resetEmailFormState}
                                    style={styles.backRow}
                                    activeOpacity={0.7}
                                >
                                    <Feather
                                        name="arrow-left"
                                        size={16}
                                        style={styles.backIcon}
                                    />
                                    <Text style={styles.backText}>Back</Text>
                                </TouchableOpacity>

                                <View style={styles.emailHeader}>
                                    <View style={styles.emailIconWrapper}>
                                        <Ionicons
                                            name="mail-outline"
                                            size={32}
                                            style={styles.emailIcon}
                                        />
                                    </View>
                                    <Text style={styles.emailTitle}>Create your account</Text>
                                    <Text style={styles.emailSubtitle}>
                                        Enter your email and create a password
                                    </Text>
                                </View>

                                {/* Email form */}
                                <View style={styles.form}>
                                    <View style={styles.field}>
                                        <Text style={styles.label}>Email</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={email}
                                            onChangeText={setEmail}
                                            placeholder="your@email.com"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                    </View>

                                    <View style={styles.field}>
                                        <Text style={styles.label}>Password</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={password}
                                            onChangeText={setPassword}
                                            placeholder="At least 6 characters"
                                            secureTextEntry
                                        />
                                    </View>

                                    <View style={styles.field}>
                                        <Text style={styles.label}>Confirm Password</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            placeholder="Confirm your password"
                                            secureTextEntry
                                        />
                                    </View>

                                    {error && (
                                        <Text style={styles.errorText}>{error}</Text>
                                    )}

                                    <Button
                                        onPress={handleEmailSubmit}
                                        size="lg"
                                        style={styles.createAccountButton}
                                        textStyle={styles.createAccountButtonText}
                                    >
                                        Create Account
                                    </Button>
                                </View>

                                <Text style={styles.termsText}>
                                    By creating an account, you agree to our Terms of Service and
                                    Privacy Policy.
                                </Text>
                            </>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = createThemedStyles(theme => ({
    flex: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },

    card: {
        width: '100%',
        maxWidth: 380,
        padding: theme.spacing.xl,
        borderRadius: theme.radii.full ?? theme.radii.xl,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 18,
        elevation: 4,
    },

    /* Success row */
    successRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.md,
    },
    successIconWrapper: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.sageLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.xs,
    },
    successIcon: {
        color: theme.colors.sage,
    },
    successText: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.sm,
        color: theme.colors.sage,
    },

    /* Header */
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    illustrationWrapper: {
        width: 80,
        height: 80,
        borderRadius: theme.radii.xl,
        overflow: 'hidden',
        marginBottom: theme.spacing.md,
    },
    illustration: {
        width: '100%',
        height: '100%',
    },
    title: {
        textAlign: 'center',
        fontFamily: theme.fontFamily.semibold,
        fontSize: theme.fontSize.display,
        lineHeight: theme.lineHeight.display,
        color: theme.colors.foreground,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        textAlign: 'center',
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.base,
        lineHeight: theme.lineHeight.base,
        color: theme.colors.mutedForeground,
    },

    /* Benefits */
    benefitsList: {
        marginBottom: theme.spacing.lg,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    benefitIconWrapper: {
        width: 32,
        height: 32,
        borderRadius: theme.radii.lg,
        backgroundColor: theme.colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    benefitIcon: {
        color: theme.colors.sage,
    },
    benefitText: {
        flex: 1,
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.base,
        lineHeight: theme.lineHeight.base,
        color: theme.colors.mutedForeground,
    },

    /* Buttons */
    buttons: {
        marginBottom: theme.spacing.md,
    },
    oauthButton: {
        width: '100%',
        marginBottom: theme.spacing.sm,
        backgroundColor: theme.colors.card,
        borderRadius: 999,
    },
    oauthButtonText: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.base,
        color: theme.colors.foreground,
    },
    oauthIcon: {
        color: theme.colors.foreground,
    },
    emailButton: {
        width: '100%',
        borderRadius: 999,
        backgroundColor: theme.colors.secondary,
    },
    emailButtonText: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.base,
        color: theme.colors.foreground,
    },

    /* Terms */
    termsText: {
        marginTop: theme.spacing.lg,
        textAlign: 'center',
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.xs,
        lineHeight: theme.lineHeight.sm,
        color: theme.colors.mutedForeground,
    },

    /* Email form header */
    backRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    backIcon: {
        color: theme.colors.mutedForeground,
        marginRight: theme.spacing.xs,
    },
    backText: {
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.sm,
        color: theme.colors.mutedForeground,
    },
    emailHeader: {
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    emailIconWrapper: {
        width: 64,
        height: 64,
        borderRadius: theme.radii.xl,
        backgroundColor: theme.colors.primarySoft ?? theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.md,
    },
    emailIcon: {
        color: theme.colors.primaryForeground ?? theme.colors.foreground,
    },
    emailTitle: {
        fontFamily: theme.fontFamily.semibold,
        fontSize: theme.fontSize.display,
        lineHeight: theme.lineHeight.display,
        color: theme.colors.foreground,
        marginBottom: theme.spacing.xs,
        textAlign: 'center',
    },
    emailSubtitle: {
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.sm,
        lineHeight: theme.lineHeight.base,
        color: theme.colors.mutedForeground,
        textAlign: 'center',
    },

    /* Form */
    form: {
        marginTop: theme.spacing.sm,
    },
    field: {
        marginBottom: theme.spacing.md,
    },
    label: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.sm,
        color: theme.colors.foreground,
        marginBottom: theme.spacing.xs,
    },
    input: {
        height: 48,
        borderRadius: theme.radii.full ?? theme.radii.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.colors.inputBackground,
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.base,
        color: theme.colors.foreground,
    },
    errorText: {
        marginTop: theme.spacing.xs,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.sm,
        color: theme.colors.destructive,
    },
    createAccountButton: {
        width: '100%',
        marginTop: theme.spacing.sm,
        borderRadius: 999,
    },
    createAccountButtonText: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.base,
        color: theme.colors.primaryForeground ?? theme.colors.foreground,
    },
}));
