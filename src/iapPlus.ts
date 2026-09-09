/** Auto-renewable Plus subscription Product IDs in App Store Connect. */
export const PLUS_SKU_MONTHLY = 'app.rhythma.cycle.plus.monthly';
export const PLUS_SKU_YEARLY = 'app.rhythma.cycle.plus.yearly';

export const PLUS_SKUS = [PLUS_SKU_MONTHLY, PLUS_SKU_YEARLY] as const;

export type PlusPlanId = 'monthly' | 'yearly';

export const PLUS_PLAN_SKUS: Record<PlusPlanId, string> = {
  monthly: PLUS_SKU_MONTHLY,
  yearly: PLUS_SKU_YEARLY,
};

/** @deprecated Prefer PLUS_SKU_MONTHLY / PLUS_SKUS — kept for older imports. */
export const PLUS_SKU = PLUS_SKU_MONTHLY;

/** StoreKit / Play Billing product query + purchase type for Plus. */
export const PLUS_PRODUCT_TYPE = 'subs' as const;

export function plusPlanForSku(sku: string): PlusPlanId | null {
  if (sku === PLUS_SKU_MONTHLY) return 'monthly';
  if (sku === PLUS_SKU_YEARLY) return 'yearly';
  return null;
}

export function isPlusSku(sku: string): boolean {
  return plusPlanForSku(sku) != null;
}
