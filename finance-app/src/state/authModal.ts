import { create } from "zustand";

type Mode = "signIn" | "signUp" | null;

type Store = {
  mode: Mode;
  open: (m: Exclude<Mode, null>) => void;
  close: () => void;
};

export const useAuthModal = create<Store>((set) => ({
  mode: null,
  open: (m) => set({ mode: m }),
  close: () => set({ mode: null }),
}));
