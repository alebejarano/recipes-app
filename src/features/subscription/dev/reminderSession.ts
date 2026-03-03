type ReminderSessionState = {
  kitchenCapacityShown: boolean
  storageReminderShown: boolean
}

const state: ReminderSessionState = {
  kitchenCapacityShown: false,
  storageReminderShown: false,
}

export function hasShownKitchenCapacityReminderInSession() {
  return state.kitchenCapacityShown
}

export function markKitchenCapacityReminderShownInSession() {
  state.kitchenCapacityShown = true
}

export function hasShownStorageReminderInSession() {
  return state.storageReminderShown
}

export function markStorageReminderShownInSession() {
  state.storageReminderShown = true
}

export function resetReminderSessionState() {
  state.kitchenCapacityShown = false
  state.storageReminderShown = false
}
