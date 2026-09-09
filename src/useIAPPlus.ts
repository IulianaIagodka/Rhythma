import { useEffect, useRef, useState } from 'react';
import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
} from 'expo-iap';
import type { Purchase } from 'expo-iap';

import {
  isPlusSku,
  PLUS_PLAN_SKUS,
  PLUS_PRODUCT_TYPE,
  PLUS_SKUS,
  type PlusPlanId,
} from './iapPlus';

export {
  isPlusSku,
  PLUS_PLAN_SKUS,
  PLUS_PRODUCT_TYPE,
  PLUS_SKU,
  PLUS_SKU_MONTHLY,
  PLUS_SKU_YEARLY,
  PLUS_SKUS,
  plusPlanForSku,
  type PlusPlanId,
} from './iapPlus';

export type IAPStatus = 'idle' | 'loading' | 'purchasing' | 'restoring' | 'error';

export type PlusPlanPrices = Record<PlusPlanId, string | null>;

type UseIAPPlusOptions = {
  onUnlock: () => void;
};

function localizedPrice(product: unknown): string | null {
  if (!product || typeof product !== 'object') return null;
  const record = product as Record<string, unknown>;
  if (typeof record.localizedPrice === 'string' && record.localizedPrice) {
    return record.localizedPrice;
  }
  if (typeof record.displayPrice === 'string' && record.displayPrice) {
    return record.displayPrice;
  }
  if (typeof record.price === 'string' || typeof record.price === 'number') {
    const currency = typeof record.currencyCode === 'string' ? record.currencyCode : '';
    return currency ? `${record.price} ${currency}` : String(record.price);
  }
  return null;
}

function productIdOf(product: unknown): string | null {
  if (!product || typeof product !== 'object') return null;
  const record = product as Record<string, unknown>;
  if (typeof record.productId === 'string') return record.productId;
  if (typeof record.id === 'string') return record.id;
  return null;
}

function isPlusPurchase(purchase: Purchase): boolean {
  return isPlusSku(purchase.productId);
}

export function useIAPPlus({ onUnlock }: UseIAPPlusOptions) {
  const [status, setStatus] = useState<IAPStatus>('idle');
  const [prices, setPrices] = useState<PlusPlanPrices>({ monthly: null, yearly: null });
  const [error, setError] = useState<string | null>(null);
  const connected = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      try {
        await initConnection();
        if (cancelled) return;
        connected.current = true;

        const products = await fetchProducts({
          skus: [...PLUS_SKUS],
          type: PLUS_PRODUCT_TYPE,
        });
        if (cancelled) return;

        const next: PlusPlanPrices = { monthly: null, yearly: null };
        for (const product of products ?? []) {
          const id = productIdOf(product);
          if (id === PLUS_PLAN_SKUS.monthly) next.monthly = localizedPrice(product);
          if (id === PLUS_PLAN_SKUS.yearly) next.yearly = localizedPrice(product);
        }
        setPrices(next);

        const existing = await getAvailablePurchases();
        if (cancelled) return;
        if (existing.some(isPlusPurchase)) {
          onUnlock();
        }
      } catch {
        // Ignore connection errors (e.g. simulator)
      }
    }

    connect();

    const purchaseSub = purchaseUpdatedListener(async (purchase: Purchase) => {
      if (!isPlusPurchase(purchase)) return;
      try {
        await finishTransaction({ purchase, isConsumable: false });
        onUnlock();
        setStatus('idle');
      } catch {
        setStatus('idle');
      }
    });

    const errorSub = purchaseErrorListener((err) => {
      if ((err as { code?: string }).code === 'E_USER_CANCELLED') {
        setStatus('idle');
        return;
      }
      setError(err.message ?? 'Purchase failed');
      setStatus('error');
    });

    return () => {
      cancelled = true;
      purchaseSub.remove();
      errorSub.remove();
      if (connected.current) {
        endConnection();
        connected.current = false;
      }
    };
  }, [onUnlock]);

  async function purchase(plan: PlusPlanId) {
    const sku = PLUS_PLAN_SKUS[plan];
    setStatus('purchasing');
    setError(null);
    try {
      await requestPurchase({
        request: { apple: { sku }, google: { skus: [sku] } },
        type: PLUS_PRODUCT_TYPE,
      });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code !== 'E_USER_CANCELLED') {
        setError((err as Error).message ?? 'Purchase failed');
        setStatus('error');
      } else {
        setStatus('idle');
      }
    }
  }

  async function restore() {
    setStatus('restoring');
    setError(null);
    try {
      await restorePurchases();
      const purchases = await getAvailablePurchases();
      if (purchases.some(isPlusPurchase)) {
        onUnlock();
        setStatus('idle');
      } else {
        setError('No previous purchase found');
        setStatus('error');
      }
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Restore failed');
      setStatus('error');
    }
  }

  return { status, prices, error, purchase, restore };
}
