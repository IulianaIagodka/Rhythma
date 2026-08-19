import { useEffect, useRef, useState } from 'react';
import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  OpenIapEvent,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
} from 'expo-iap';
import type { Purchase } from 'expo-iap';

export const PLUS_SKU = 'app.rhythma.cycle.plus';

export type IAPStatus = 'idle' | 'loading' | 'purchasing' | 'restoring' | 'error';

type UseIAPPlusOptions = {
  onUnlock: () => void;
};

export function useIAPPlus({ onUnlock }: UseIAPPlusOptions) {
  const [status, setStatus] = useState<IAPStatus>('idle');
  const [price, setPrice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const connected = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      try {
        await initConnection();
        if (cancelled) return;
        connected.current = true;

        const products = await fetchProducts({ skus: [PLUS_SKU], type: 'in-app' });
        if (cancelled) return;
        if (products && products.length > 0) {
          const product = products![0];
          const localPrice =
            'localizedPrice' in product && product.localizedPrice
              ? (product.localizedPrice as string)
              : 'currencyCode' in product && 'price' in product
                ? `${product.price} ${product.currencyCode}`
                : null;
          setPrice(localPrice);
        }

        // Restore any existing purchase silently on mount
        const existing = await getAvailablePurchases();
        if (cancelled) return;
        if (existing.some((p) => p.productId === PLUS_SKU)) {
          onUnlock();
        }
      } catch {
        // Ignore connection errors (e.g. simulator)
      }
    }

    connect();

    const purchaseSub = purchaseUpdatedListener(async (purchase: Purchase) => {
      if (purchase.productId !== PLUS_SKU) return;
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

  async function purchase() {
    setStatus('purchasing');
    setError(null);
    try {
      await requestPurchase({
        request: { apple: { sku: PLUS_SKU }, google: { skus: [PLUS_SKU] } },
        type: 'in-app',
      });
      // Result arrives via purchaseUpdatedListener
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
      if (purchases.some((p) => p.productId === PLUS_SKU)) {
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

  return { status, price, error, purchase, restore };
}
