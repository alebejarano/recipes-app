// src/features/auth/components/OAuthButtons.tsx

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Button from '@/components/Button';
import { createThemedStyles } from '@/styles/createStyles';

type Props = {
    onApplePress: () => void;
    onGooglePress: () => void;
};

export default function OAuthButtons({ onApplePress, onGooglePress }: Props) {
    return (
        <View style={styles.container}>
            <View style={styles.separatorRow}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>Or continue with</Text>
                <View style={styles.separatorLine} />
            </View>

            <View style={styles.buttons}>
                <Button
                    onPress={onApplePress}
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
                    onPress={onGooglePress}
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
            </View>
        </View>
    );
}

const styles = createThemedStyles(theme => ({
    container: {
        marginTop: theme.spacing.xl,
    },
    separatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    separatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: theme.colors.border,
    },
    separatorText: {
        marginHorizontal: theme.spacing.sm,
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.xs,
        color: theme.colors.mutedForeground,
    },
    buttons: {},
    oauthButton: {
        width: '100%',
        borderRadius: 999,
        marginBottom: theme.spacing.sm,
        backgroundColor: theme.colors.card,
    },
    oauthButtonText: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.base,
        color: theme.colors.foreground,
    },
    oauthIcon: {
        color: theme.colors.foreground,
    },
}));
