import { create } from 'zustand'

interface CommonStore {
    loggedWallet: string | null
    setWallet: (wallet: string | null) => void
}

const useCommonStore = create<CommonStore>((set) => ({
    loggedWallet: null,
    setWallet: (wallet) => set({ loggedWallet: wallet }),
}))

export default useCommonStore
