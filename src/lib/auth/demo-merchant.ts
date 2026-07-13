export const DEMO_MERCHANT_USERNAME = "fongkham-demo";
export const DEMO_MERCHANT_EMAIL = "fongkham-demo@nan-tourism-hackathon.vercel.app";
export const DEMO_MERCHANT_PASSWORD = "NanCoffee2026!";
export const DEMO_MERCHANT_SHOP_NAME = "ฟองคำ คอฟฟี่พอยต์";
export const DEMO_MERCHANT_PROFILE_ID = "merchant-demo-01";

export const DEMO_MERCHANT_CREDENTIALS = {
  username: DEMO_MERCHANT_USERNAME,
  email: DEMO_MERCHANT_EMAIL,
  password: DEMO_MERCHANT_PASSWORD,
  shopName: DEMO_MERCHANT_SHOP_NAME,
} as const;

/**
 * Supabase Auth signs in with an email address. The MVP login screen may accept
 * either the public demo username or its internal Auth email, but no arbitrary
 * email address is allowed through this demo-only mapping.
 */
export function mapMerchantLoginToEmail(identifier: string) {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  if (
    normalizedIdentifier === DEMO_MERCHANT_USERNAME ||
    normalizedIdentifier === DEMO_MERCHANT_EMAIL
  ) {
    return DEMO_MERCHANT_EMAIL;
  }

  return null;
}

/** Restrict post-login navigation to the sole merchant route in the MVP. */
export function getSafeMerchantNextPath(nextPath: string | null | undefined) {
  return nextPath === "/merchant" ? nextPath : "/merchant";
}
