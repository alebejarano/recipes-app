import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'

import Screen from '@/components/Screen'
import { useConversionReference } from '@/features/recipes/hooks/useConversionReference'
import type { ConversionIngredient, RecipeUnit } from '@/features/recipes/utils/ingredientMeasurements'
import { useTranslation } from '@/localization'
import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

type Selector = 'ingredient' | 'from' | 'to' | null
const ANY = 'any'

function format(value: number) {
  return Number.isFinite(value) ? new Intl.NumberFormat(undefined, { maximumFractionDigits: value < 10 ? 2 : 0 }).format(value) : '—'
}

function convert(value: number, from: RecipeUnit | undefined, to: RecipeUnit | undefined, ingredient: ConversionIngredient | undefined, units: RecipeUnit[], weights: { ingredientId: string; unitId: string; gramsPerUnit: number }[]) {
  if (!from || !to) return null
  if (from.dimension === to.dimension && from.toBaseFactor && to.toBaseFactor) return { value: value * from.toBaseFactor / to.toBaseFactor, approximate: false }
  const cupWeight = ingredient && weights.find((item) => item.ingredientId === ingredient.id && item.unitId === 'cup')
  const cup = units.find((item) => item.id === 'cup')
  if (!cupWeight || !cup?.toBaseFactor || !from.toBaseFactor || !to.toBaseFactor) return null
  if (from.dimension === 'volume' && to.dimension === 'mass') return { value: value * from.toBaseFactor / cup.toBaseFactor * cupWeight.gramsPerUnit / to.toBaseFactor, approximate: true }
  if (from.dimension === 'mass' && to.dimension === 'volume') return { value: value * from.toBaseFactor / cupWeight.gramsPerUnit * cup.toBaseFactor / to.toBaseFactor, approximate: true }
  return null
}

export default function UnitConverterScreen() {
  const { t } = useTranslation()
  const referenceQuery = useConversionReference()
  const reference = referenceQuery.data
  const units = useMemo(() => (reference?.units ?? []).filter((unit) => unit.dimension === 'mass' || unit.dimension === 'volume'), [reference?.units])
  const [amount, setAmount] = useState('1')
  const [fromId, setFromId] = useState('cup')
  const [toId, setToId] = useState('g')
  const [ingredientId, setIngredientId] = useState(ANY)
  const [temperature, setTemperature] = useState('20')
  const [isCelsius, setIsCelsius] = useState(true)
  const [selector, setSelector] = useState<Selector>(null)
  const [query, setQuery] = useState('')
  const from = units.find((unit) => unit.id === fromId)
  const to = units.find((unit) => unit.id === toId)
  const ingredient = reference?.ingredients.find((item) => item.id === ingredientId)
  const result = convert(Number(amount.replace(',', '.')) || 0, from, to, ingredient, units, reference?.weights ?? [])
  const crossType = from?.dimension !== to?.dimension
  const tempResult = isCelsius ? (Number(temperature.replace(',', '.')) || 0) * 9 / 5 + 32 : ((Number(temperature.replace(',', '.')) || 0) - 32) * 5 / 9
  const shownIngredient = ingredient?.canonicalName ?? t('converter.ingredients.any')
  const availableIngredients = (reference?.ingredients ?? []).filter((item) => [item.canonicalName, ...item.aliases].join(' ').toLowerCase().includes(query.trim().toLowerCase()))
  const open = (next: Exclude<Selector, null>) => { setQuery(''); setSelector(next) }

  return <Screen scroll keyboardAware contentStyle={styles.content}>
    <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel={t('converter.back')}><Feather name="chevron-left" size={18} style={styles.backIcon} /><Text style={styles.backText}>{t('converter.back')}</Text></Pressable>
    <View style={styles.hero}><Text style={styles.title}>{t('converter.title')}</Text><Text style={styles.subtitle}>{t('converter.intro')}</Text></View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('converter.measurements.title')}</Text>
      <View style={styles.measurementCard}>
        <View style={styles.ingredientRow}><Text style={styles.ingredientLabel}>{t('converter.measurements.ingredient')}</Text><Pressable onPress={() => open('ingredient')} style={styles.ingredientSelector}><Text style={styles.ingredientSelectorText} numberOfLines={1}>{shownIngredient}</Text><Feather name="chevron-down" size={22} color={theme.colors.primaryDark} /></Pressable></View>
        <View style={styles.conversionArea}>
          <MeasurementRow value={amount} onChangeText={setAmount} unit={from} onPressUnit={() => open('from')} editable />
          <Swap onPress={() => { setFromId(toId); setToId(fromId) }} label={t('converter.swapUnits')} />
          <MeasurementRow value={result ? `${result.approximate ? '~' : ''}${format(result.value)}` : '—'} unit={to} onPressUnit={() => open('to')} />
        </View>
        <Text style={styles.note}>{crossType && !result ? t('converter.measurements.sameTypeOnly') : result?.approximate ? t('converter.measurements.approximation', { ingredient: shownIngredient, value: `${amount || 0} ${from?.symbol ?? ''}`, result: `${format(result.value)} ${to?.symbol ?? ''}` }) : `${amount || 0} ${from?.symbol ?? ''} = ${format(result?.value ?? 0)} ${to?.symbol ?? ''}`}</Text>
      </View>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('converter.temperature.title')}</Text>
      <View style={styles.temperatureCard}>
        <TemperatureRow value={temperature} onChangeText={setTemperature} unit={isCelsius ? '°C' : '°F'} editable />
        <Swap onPress={() => setIsCelsius((value) => !value)} label={t('converter.temperature.swap')} />
        <TemperatureRow value={format(tempResult)} unit={isCelsius ? '°F' : '°C'} />
      </View>
    </View>

    <Modal visible={Boolean(selector)} transparent animationType="slide" onRequestClose={() => setSelector(null)}>
      <KeyboardAvoidingView style={styles.modalFlex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.backdrop} onPress={() => setSelector(null)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{selector === 'ingredient' ? t('converter.measurements.chooseIngredient') : t('converter.measurements.chooseUnit')}</Text>
              {selector === 'ingredient' ? <TextInput value={query} onChangeText={setQuery} placeholder={t('converter.measurements.searchIngredients')} placeholderTextColor={theme.colors.mutedForeground} autoFocus style={styles.searchInput} /> : null}
            </View>
            <ScrollView style={styles.options} contentContainerStyle={styles.optionsContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {selector === 'ingredient' ? <Option title={t('converter.ingredients.any')} subtitle={t('converter.ingredients.anyHelp')} onPress={() => { setIngredientId(ANY); setSelector(null) }} /> : null}
              {(selector === 'ingredient' ? availableIngredients : units).map((item) => {
                const ingredientOption = selector === 'ingredient'; const id = ingredientOption ? (item as ConversionIngredient).id : (item as RecipeUnit).id; const title = ingredientOption ? (item as ConversionIngredient).canonicalName : `${(item as RecipeUnit).name} (${(item as RecipeUnit).symbol})`
                return <Option key={id} title={title} onPress={() => { if (selector === 'ingredient') setIngredientId(id); if (selector === 'from') setFromId(id); if (selector === 'to') setToId(id); setSelector(null) }} />
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
    {referenceQuery.isLoading ? <ActivityIndicator color={theme.colors.primary} /> : null}
  </Screen>
}

function Option({ title, subtitle, onPress }: { title: string; subtitle?: string; onPress: () => void }) { return <Pressable style={styles.sheetOption} onPress={onPress}><Text style={styles.optionTitle}>{title}</Text>{subtitle ? <Text style={styles.optionSubtitle}>{subtitle}</Text> : null}</Pressable> }
function Swap({ onPress, label }: { onPress: () => void; label: string }) { return <View style={styles.swapLine}><View style={styles.line} /><Pressable onPress={onPress} style={styles.swap} accessibilityRole="button" accessibilityLabel={label}><Feather name="repeat" size={28} color={theme.colors.primaryDark} /></Pressable><View style={styles.line} /></View> }
function MeasurementRow({ value, unit, onChangeText, onPressUnit, editable = false }: { value: string; unit?: RecipeUnit; onChangeText?: (value: string) => void; onPressUnit: () => void; editable?: boolean }) { return <View style={styles.row}>{editable ? <TextInput value={value} onChangeText={onChangeText} keyboardType="decimal-pad" style={styles.value} /> : <Text selectable style={[styles.value, styles.valueResult]}>{value}</Text>}<Pressable onPress={onPressUnit} style={styles.unit}><Text style={styles.unitText}>{unit?.symbol ?? '—'}</Text><Feather name="chevron-down" size={22} color={theme.colors.foreground} /></Pressable></View> }
function TemperatureRow({ value, unit, onChangeText, editable = false }: { value: string; unit: string; onChangeText?: (value: string) => void; editable?: boolean }) { return <View style={styles.row}>{editable ? <TextInput value={value} onChangeText={onChangeText} keyboardType="decimal-pad" style={styles.value} /> : <Text selectable style={[styles.value, styles.valueResult]}>{value}</Text>}<Text style={styles.temperatureUnit}>{unit}</Text></View> }

const styles = createThemedStyles((theme) => ({
  content: { paddingTop: theme.spacing.sm, paddingBottom: theme.spacing['3xl'], gap: theme.spacing.xl }, back: { width: '100%', minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.sm }, backIcon: { color: theme.colors.mutedForeground }, backText: { marginLeft: theme.spacing.xs, ...theme.textVariants.body, color: theme.colors.mutedForeground }, hero: { gap: theme.spacing.xs }, title: { ...theme.textVariants.display, color: theme.colors.foreground }, subtitle: { ...theme.textVariants.body, color: theme.colors.mutedForeground }, section: { gap: theme.spacing.sm }, sectionTitle: { ...theme.textVariants.label, color: theme.colors.mutedForeground, letterSpacing: 0.6, textTransform: 'uppercase' }, measurementCard: { overflow: 'hidden', borderRadius: theme.radii.xl, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border }, ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.border }, ingredientLabel: { flex: 1, ...theme.textVariants.body, color: theme.colors.mutedForeground }, ingredientSelector: { flex: 1.65, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderWidth: 1, borderRadius: theme.radii.lg, borderColor: theme.colors.primarySoft, backgroundColor: theme.colors.primary16 }, ingredientSelectorText: { flex: 1, ...theme.textVariants.label, color: theme.colors.primaryDark }, conversionArea: { padding: theme.spacing.lg, gap: theme.spacing.xs }, row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }, value: { flex: 1, padding: 0, ...theme.textVariants.display, color: theme.colors.foreground }, valueResult: { color: theme.colors.primaryDark }, unit: { minWidth: 112, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.xs, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderWidth: 1, borderRadius: theme.radii.lg, borderColor: theme.colors.border, backgroundColor: theme.colors.secondary }, unitText: { ...theme.textVariants.label, color: theme.colors.foreground }, temperatureUnit: { minWidth: 64, ...theme.textVariants.label, color: theme.colors.mutedForeground, textAlign: 'right' }, swapLine: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }, line: { flex: 1, height: 1, backgroundColor: theme.colors.border }, swap: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: theme.radii.full, borderColor: theme.colors.border, backgroundColor: theme.colors.card }, note: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.colors.border, ...theme.textVariants.body, color: theme.colors.mutedForeground }, temperatureCard: { padding: theme.spacing.lg, gap: theme.spacing.xs, borderRadius: theme.radii.xl, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border }, modalFlex: { flex: 1 }, backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.3)' }, sheet: { height: '78%', minHeight: 360, borderTopLeftRadius: theme.radii.xl, borderTopRightRadius: theme.radii.xl, backgroundColor: theme.colors.background, overflow: 'hidden' }, sheetHeader: { flexShrink: 0, gap: theme.spacing.sm, padding: theme.spacing.xl, paddingBottom: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border }, sheetTitle: { ...theme.textVariants.title, color: theme.colors.foreground }, searchInput: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderWidth: 1, borderRadius: theme.radii.md, borderColor: theme.colors.border, ...theme.textVariants.body, color: theme.colors.foreground }, options: { flex: 1 }, optionsContent: { paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing['3xl'] }, sheetOption: { gap: 2, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border }, optionTitle: { ...theme.textVariants.label, color: theme.colors.foreground }, optionSubtitle: { ...theme.textVariants.caption, color: theme.colors.mutedForeground },
}))
