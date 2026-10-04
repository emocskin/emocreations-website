// types/index.d.ts

// ==========================================
// 1. AI BLENDING & PRODUCT TYPES
// ==========================================

export interface BlendIngredient {
  oil_name: string;
  botanical_name: string;
  drops: number;
  note: "top" | "middle" | "base";
  purpose: string;
}

export interface BlendRecipe {
  blend_name: string;
  scent_profile: string;
  ingredients: BlendIngredient[];
  carrier_oil_recommendation: string;
  usage_instructions: string;
  safety_warnings: string[];
}

export interface BlendPreferences {
  goal: "relaxation" | "energy" | "sleep" | "focus" | string;
  notes: string;
}

export interface BlendProduct {
  name: string;
  slug: string;
  price: number; // USD price
  xec: number;   // Base XEC price (can be dynamic, but good for catalog display)
  recipe?: BlendRecipe[]; // For pre-made blends
  description?: string;
  instructions?: string;
  isAi?: boolean;
}

// ==========================================
// 2. DATABASE TYPES (Supabase Canonical Schema)
// ==========================================

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'fulfilled' | 'failed';

export interface Order {
  id: string;
  created_at: string;
  updated_at: string;
  status: OrderStatus;
  customer_wallet_address: string | null;
  tx_hash: string | null;
  xec_amount: number | null; // Canonical name matching your DB
  email: string | null;      // Canonical name matching your DB
  blend_preferences: BlendPreferences | null;
  blend_recipe: BlendRecipe | null;
}

// ==========================================
// 3. API PAYLOAD TYPES (Frontend <-> Backend)
// ==========================================

// Sent by frontend to create an initial pending order
export interface CreateOrderPayload {
  productSlug: string;
  customerWalletAddress: string;
  usdValue: number;
  requiredXec: number;
}

// Sent by backend to frontend to confirm order creation
export interface CreateOrderResponse {
  orderId: string;
  status: OrderStatus;
  xecAmount: number;
}

// Sent by frontend to backend AFTER Xaman wallet signs the transaction
export interface VerifyPaymentPayload {
  txHash: string;
  expectedAmount: number;
  orderId: string;
}

// Sent by frontend to backend AFTER payment is verified, to trigger the AI Agent
export interface FinalizeOrderPayload {
  orderId: string;
  email: string;
  wellnessGoal: string;
  additionalNotes: string;
}

// ==========================================
// 4. GLOBAL WINDOW EXTENSIONS
// ==========================================

declare global {
  interface Window {
    // Xaman (formerly Xumm) SDK
    Xumm?: {
      payload?: {
        create: (payload: any, push?: boolean) => Promise<any>;
        get: (uuid: string) => Promise<any>;
      };
    };
    
    // PayPal SDK
    paypal?: {
      Buttons: (options: any) => {
        render: (container: string | HTMLElement) => void;
      };
    };
  }
}

// This export is required to make this file a module
export {};
