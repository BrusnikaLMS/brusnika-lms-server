import { create } from 'zustand'

interface LmsUserState {
  userId: string | number | null
  setUserId: (id: string | number) => void
}

export const useLmsUserStore = create<LmsUserState>((set) => ({
  userId: null,
  setUserId: (id) => set({ userId: id }),
}))
