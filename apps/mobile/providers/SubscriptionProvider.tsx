import { createContext, useContext, useMemo } from 'react';

/**
 * Billing removed — Recall is free for every signed-in user.
 * Kept as a thin provider so existing screens can keep calling useSubscription().
 */
type SubscriptionContextValue = {
  isLoading: boolean;
  hasRecallAccess: boolean;
  isPro: boolean;
  openAccess: boolean;
  offering: null;
  error: string | null;
  purchase: () => Promise<'active'>;
  purchaseWithCard: () => Promise<'active'>;
  restorePurchases: () => Promise<'active'>;
  refresh: () => Promise<void>;
  manageSubscriptions: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(
  null,
);

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useMemo<SubscriptionContextValue>(
    () => ({
      isLoading: false,
      hasRecallAccess: true,
      isPro: true,
      openAccess: true,
      offering: null,
      error: null,
      purchase: async () => 'active',
      purchaseWithCard: async () => 'active',
      restorePurchases: async () => 'active',
      refresh: async () => undefined,
      manageSubscriptions: async () => undefined,
    }),
    [],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context)
    throw new Error(
      'useSubscription must be used within SubscriptionProvider.',
    );
  return context;
}
