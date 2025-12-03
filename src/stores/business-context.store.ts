import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Business {
    id: string;
    name: string;
    status: string;
}

interface BusinessContextState {
    activeBusinessId: string | null;
    activeBusiness: Business | null;
    businesses: Business[];
    setBusinesses: (businesses: Business[]) => void;
    setActiveBusiness: (businessId: string) => void;
    clearContext: () => void;
}

export const useBusinessContext = create<BusinessContextState>()(
    persist(
        (set, get) => ({
            activeBusinessId: null,
            activeBusiness: null,
            businesses: [],

            setBusinesses: (businesses) => {
                const { activeBusinessId } = get();
                // If no active business is selected, or the selected one is not in the new list,
                // select the first one automatically
                let newActiveId = activeBusinessId;
                let newActiveBusiness = businesses.find(b => b.id === activeBusinessId) || null;

                if ((!activeBusinessId || !newActiveBusiness) && businesses.length > 0) {
                    newActiveId = businesses[0].id;
                    newActiveBusiness = businesses[0];
                }

                set({
                    businesses,
                    activeBusinessId: newActiveId,
                    activeBusiness: newActiveBusiness
                });
            },

            setActiveBusiness: (businessId) => {
                const { businesses } = get();
                const business = businesses.find((b) => b.id === businessId);
                if (business) {
                    set({ activeBusinessId: businessId, activeBusiness: business });
                }
            },

            clearContext: () => {
                set({ activeBusinessId: null, activeBusiness: null, businesses: [] });
            },
        }),
        {
            name: 'business-context-storage',
        }
    )
);
