import { create } from 'zustand';

interface TabStore {
    selectedTab: string;
    setSelectedTab: (tab: string) => void;
}

export const useTabStore = create<TabStore>((set) => ({
    selectedTab: 'send',
    setSelectedTab: (tab: string) => {
        console.log('Zustand: Setting tab to', tab);
        set({ selectedTab: tab });
    },
}));