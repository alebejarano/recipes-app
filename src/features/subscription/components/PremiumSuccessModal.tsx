import React from 'react'
import { Animated, Easing, Image, Modal, Pressable, Text, View } from 'react-native'

import { createThemedStyles } from '@/styles/createStyles'

type PremiumSuccessModalProps = {
  visible: boolean
  onClose: () => void
}

type ConfettiPiece = {
  id: number
  left: `${number}%`
  delayMs: number
  durationMs: number
  color: (typeof CONFETTI_COLORS)[number]
  size: number
  rotation: number
}

const highlightedBenefits = ['Unlimited recipes.', 'Cloud backup.', 'Sync everywhere.']

const CONFETTI_COLORS = [
  'hsl(25, 80%, 52%)',
  'hsl(42, 85%, 62%)',
  'hsl(0, 65%, 55%)',
  'hsl(160, 45%, 48%)',
  'hsl(340, 50%, 60%)',
  'hsl(45, 100%, 75%)',
] as const

export default function PremiumSuccessModal({ visible, onClose }: PremiumSuccessModalProps) {
  const [cardHeight, setCardHeight] = React.useState(0)
  const confettiPieces = React.useMemo(
    () =>
      Array.from({ length: 24 }, (_, index): ConfettiPiece => ({
        id: index,
        left: `${Math.random() * 100}%` as `${number}%`,
        delayMs: Math.floor(Math.random() * 2000),
        durationMs: Math.floor((2 + Math.random() * 2) * 1000),
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        size: 4 + Math.random() * 6,
        rotation: Math.random() * 360,
      })),
    [],
  )
  const fallValues = React.useRef(confettiPieces.map(() => new Animated.Value(0))).current
  const spinValues = React.useRef(confettiPieces.map(() => new Animated.Value(0))).current
  const animationsRef = React.useRef<Animated.CompositeAnimation[]>([])

  React.useEffect(() => {
    animationsRef.current.forEach((animation) => animation.stop())
    animationsRef.current = []

    if (!visible) {
      fallValues.forEach((value) => value.setValue(0))
      spinValues.forEach((value) => value.setValue(0))
      return
    }

    const pieceAnimations: Animated.CompositeAnimation[] = confettiPieces.flatMap((piece, index) => {
      const fall = Animated.loop(
        Animated.sequence([
          Animated.delay(piece.delayMs),
          Animated.timing(fallValues[index], {
            toValue: 1,
            duration: piece.durationMs,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      )

      const spin = Animated.loop(
        Animated.sequence([
          Animated.delay(piece.delayMs),
          Animated.timing(spinValues[index], {
            toValue: 1,
            duration: Math.max(1100, Math.floor(piece.durationMs * 0.75)),
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(spinValues[index], {
            toValue: 0,
            duration: Math.max(1100, Math.floor(piece.durationMs * 0.75)),
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      )

      return [fall, spin]
    })

    animationsRef.current = pieceAnimations
    pieceAnimations.forEach((animation) => animation.start())

    return () => {
      pieceAnimations.forEach((animation) => animation.stop())
    }
  }, [confettiPieces, fallValues, spinValues, visible])

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card} onLayout={(event) => setCardHeight(event.nativeEvent.layout.height)}>
          <View pointerEvents="none" style={styles.confettiLayer}>
            {confettiPieces.map((piece, index) => {
              const travelDistance = Math.max(300, cardHeight - 148)
              const translateY = fallValues[index].interpolate({
                inputRange: [0, 1],
                outputRange: [-12, travelDistance],
              })
              const swayX = fallValues[index].interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [-5, 6, -4],
              })
              const rotate = spinValues[index].interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [`${piece.rotation}deg`, `${piece.rotation + 90}deg`, `${piece.rotation + 180}deg`],
              })
              const opacity = fallValues[index].interpolate({
                inputRange: [0, 0.55, 0.8, 1],
                outputRange: [0.95, 0.85, 0.35, 0],
              })

              return (
                <Animated.View
                  key={piece.id}
                  style={[
                    styles.confettiParticle,
                    {
                      left: piece.left,
                      top: -10,
                      width: piece.size,
                      height: piece.size * 1.4,
                      borderRadius: piece.size > 7 ? piece.size / 2 : 2,
                      backgroundColor: piece.color,
                      opacity,
                      transform: [{ translateX: swayX }, { translateY }, { rotate }],
                    },
                  ]}
                />
              )
            })}
          </View>

          <View style={styles.heroWrap}>
            <Image
              source={require('@assets/illustrations/magic-kitchen.png')}
              resizeMode="contain"
              style={styles.heroImage}
            />
          </View>

          <Text style={styles.title}>Welcome to Premium!</Text>
          <Text style={styles.subtitle}>Your kitchen just got an upgrade.</Text>

          <View style={styles.benefitsWrap}>
            {highlightedBenefits.map((benefit) => (
              <Text key={benefit} style={styles.benefitLine}>
                {benefit}
              </Text>
            ))}
          </View>

          <View style={styles.footerCopy}>
            <Text style={styles.footerLine}>Nothing gets lost.</Text>
            <Text style={styles.footerLine}>Everything stays deliciously organized.</Text>
          </View>

          <Pressable onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
            <Text style={styles.closeButtonText}>Let&apos;s cook  →</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = createThemedStyles((theme) => ({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 430,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing['2xl'],
    paddingTop: theme.spacing['2xl'],
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  heroWrap: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroImage: {
    width: 200,
    height: 500,
  },
  confettiLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 92,
    overflow: 'hidden',
  },
  confettiParticle: {
    position: 'absolute',
  },
  title: {
    textAlign: 'center',
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.display,
    lineHeight: theme.lineHeight.xxl,
    color: theme.colors.foreground,
  },
  subtitle: {
    textAlign: 'center',
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.accent,
  },
  benefitsWrap: {
    marginTop: theme.spacing.xs,
    gap: theme.spacing.xs,
    alignItems: 'center',
  },
  benefitLine: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  footerCopy: {
    marginTop: theme.spacing.xs,
    alignItems: 'center',
  },
  footerLine: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
    paddingHorizontal: theme.spacing.xl,
  },
  closeButtonText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.accentForeground,
  },
  pressed: {
    opacity: 0.9,
  },
}))
