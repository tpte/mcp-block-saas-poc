/** Internal billing spec — not exposed in product UI. */
export type BillingPlan = 'free' | 'pro' | 'enterprise'

export type UsageMeter = {
  workspaceId: string
  period: string
  llmTokens: number
  invokeCount: number
  storageBytes: number
  computeMs: number
}

export type BillingQuote = {
  plan: BillingPlan
  seatPriceUsd: number
  includedTokens: number
  overagePer1kTokensUsd: number
  storageGbIncluded: number
  computeHourIncluded: number
}

export const BILLING_SPEC_VERSION = '2026-10-20'

export const DEFAULT_QUOTES: Record<BillingPlan, BillingQuote> = {
  free: {
    plan: 'free',
    seatPriceUsd: 0,
    includedTokens: 200_000,
    overagePer1kTokensUsd: 0,
    storageGbIncluded: 1,
    computeHourIncluded: 5,
  },
  pro: {
    plan: 'pro',
    seatPriceUsd: 29,
    includedTokens: 2_000_000,
    overagePer1kTokensUsd: 0.8,
    storageGbIncluded: 50,
    computeHourIncluded: 100,
  },
  enterprise: {
    plan: 'enterprise',
    seatPriceUsd: 0,
    includedTokens: 0,
    overagePer1kTokensUsd: 0,
    storageGbIncluded: 0,
    computeHourIncluded: 0,
  },
}
