import { create } from 'zustand'

type SnackbarNotice = {
  id: number
  message: string
}

type TransientSnackbarState = {
  notice: SnackbarNotice | null
  show: (message: string) => void
  clear: () => void
}

export const useTransientSnackbarStore = create<TransientSnackbarState>((set) => ({
  notice: null,
  show: (message: string) =>
    set({
      notice: {
        id: Date.now(),
        message,
      },
    }),
  clear: () => set({ notice: null }),
}))
