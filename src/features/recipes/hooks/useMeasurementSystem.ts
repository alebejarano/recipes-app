import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useState } from 'react'

import type { MeasurementSystem } from '@/features/recipes/utils/ingredientMeasurements'

const MEASUREMENT_SYSTEM_KEY = 'recipes:measurement-system'

export function useMeasurementSystem() {
  const [measurementSystem, setMeasurementSystemState] = useState<MeasurementSystem>('original')

  useEffect(() => {
    void AsyncStorage.getItem(MEASUREMENT_SYSTEM_KEY).then((value) => {
      if (value === 'original' || value === 'metric' || value === 'us') setMeasurementSystemState(value)
    })
  }, [])

  const setMeasurementSystem = (next: MeasurementSystem) => {
    setMeasurementSystemState(next)
    void AsyncStorage.setItem(MEASUREMENT_SYSTEM_KEY, next)
  }

  return { measurementSystem, setMeasurementSystem }
}
