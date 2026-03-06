// types/index.d.ts
export interface BlendRecipe {
  oil: string;
  drops: number;
  purpose: string;
}

export interface BlendProduct {
  name: string;
  slug: string;
  price: number;
  xec: number;
  recipe?: BlendRecipe[];
  description?: string;
  instructions?: string;
  isAi?: boolean;
}

export interface XecPaymentPayload {
  address: string;
  blendSlug: string;
  blendRecipe?: BlendRecipe[];
  blendName?: string;
  blendDescription?: string;
  blendInstructions?: string;
  userPrompt?: string;
  paymentMethod: 'xec' | 'paypal';
  xecAmount?: number;
  usdValue: number;
  price: number;
  requiredXec: number;
}

declare global {
  interface Window {
    Xumm?: any; // Xaman SDK
    paypal?: any; // PayPal SDK
  }
}
