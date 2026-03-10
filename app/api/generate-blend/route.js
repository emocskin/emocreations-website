// app/api/generate-blend/route.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { Client } from 'xrpl';

// ✅ Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ Poe/OpenAI client
const poeClient = process.env.POE_API_KEY 
  ? new OpenAI({
      apiKey: process.env.POE_API_KEY,
      baseURL: 'https://api.poe.com/v1',
    })
  : null;

// ✅ Rate Limiter
let ratelimit;
const getRatelimit = () => {
  if (!ratelimit && process.env.UPSTASH_REDIS_REST_URL) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '60 s'),
      analytics: true,
      prefix: 'emocreations:blend-gen',
    });
  }
  return ratelimit;
};

// ✅ XEC Token Configuration
const XEC_CONFIG = {
  currency: 'XEC',
  issuer: 'rJzq9Xwg1ZNRmSk5uyPoHdLDffpctv26CX',
  requiredUsdThreshold: 25,
};

// ✅✅✅ HELPER: Verify user authorization (XEC balance or Preview mode)
async function verifyUserAuthorization(request, blendData) {
  const authHeader = request.headers.get('authorization');
  const xrplAddress = request.headers.get('x-xrpl-address');
  const isPreviewRequest = request.headers.get('x-preview') === 'true';
  
  const priceUsd = blendData.price || 38;
  const requiredXec = Math.ceil(priceUsd / 0.37);

  // ✅ Option 1: Allow PREVIEW mode (no auth required - limited data)
  if (isPreviewRequest) {
    console.log('🔍 Preview mode requested - returning limited data');
    return { authorized: true, previewMode: true };
  }

  // ✅ Option 2: Check XRPL Address Header (For XEC Payment Auth)
  if (xrplAddress) {
    try {
      console.log('🔍 Checking XEC balance for address:', xrplAddress.slice(0, 10) + '...');
      
      const client = new Client('wss://s1.ripple.com:51233');
      await client.connect();
      
      const response = await client.request({
        method: 'account_lines',
        account: xrplAddress,
        peer: XEC_CONFIG.issuer,
      });
      
      await client.disconnect();
      
      let xecBalance = 0;
      const trustline = response.result.lines.find(
        line => line.currency === XEC_CONFIG.currency && line.account === XEC_CONFIG.issuer
      );
      
      if (trustline) {
        xecBalance = parseFloat(trustline.balance);
      }
      
      // Get current XEC price
      let xecPriceUsd = 0.0004;
      try {
        const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ecash&vs_currencies=usd');
        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          xecPriceUsd = priceData.ecash?.usd || priceData.xec?.usd || 0.0004;
        }
      } catch (e) {
        console.warn('⚠️ Using fallback XEC price:', e);
      }
      
      const usdValue = xecBalance * xecPriceUsd;
      console.log('📊 XEC Balance:', xecBalance, '| USD Value:', usdValue.toFixed(2));
      
      // Check if balance meets threshold
      if (xecBalance >= requiredXec && usdValue >= XEC_CONFIG.requiredUsdThreshold) {
        console.log('✅ XEC Balance verified successfully');
        return { 
          authorized: true, 
          previewMode: false,
          method: 'xec-balance',
          xecBalance,
          usdValue
        };
      } else {
        console.log('❌ Insufficient XEC balance');
        return { 
          authorized: false, 
          previewMode: false,
          method: 'insufficient-balance'
        };
      }
    } catch (e) {
      console.error('❌ XEC balance verification failed:', e.message);
      // Continue to other auth methods
    }
  }

  // ❌ No valid auth found
  console.log('❌ No valid authorization found');
  return { authorized: false, previewMode: false };
}

// ✅✅✅ ULTIMATE ESSENTIAL OIL LIBRARY - 150+ CONDITIONS
const ESSENTIAL_OILS = {
  // Include your extensive essential oils library here exactly as you had it
  // (Same content from your route.js file above)
  headache: [
    { name: "Peppermint", amount: "8 drops", purpose: "Cooling pain relief" },
    { name: "Lavender", amount: "10 drops", purpose: "Calms nervous system" },
    { name: "Eucalyptus", amount: "6 drops", purpose: "Opens sinuses, reduces inflammation" }
  ],
  stress: [
    { name: "Lavender", amount: "10 drops", purpose: "Calms nerves, reduces inflammation" },
    { name: "Roman Chamomile", amount: "8 drops", purpose: "Potent antispasmodic, soothes tissue" },
    { name: "Bergamot FCF", amount: "6 drops", purpose: "Uplifting, zero phototoxicity" }
  ],
  insomnia: [
    { name: "Lavender", amount: "12 drops", purpose: "Promotes restful sleep" },
    { name: "Ylang Ylang", amount: "6 drops", purpose: "Sedative, balances emotions" },
    { name: "Cedarwood", amount: "6 drops", purpose: "Grounding, promotes focus" }
  ],
  // ⚠️ COMPLETE YOUR ESSENTIAL OIL LIBRARY FROM THE ROUTE.JS FILE HERE
};

// ✅ Helper functions (detectCondition, transformOilsToRecipe, calculatePricing, etc.)
// ⚠️ INCLUDE ALL HELPER FUNCTIONS FROM YOUR ORIGINAL route.js HERE

// ✅ Poe AI: Generate truly custom blend (fallback)
async function generateAiBlend(userInput) {
  if (!poeClient) {
    throw new Error('Poe API not configured. Please set POE_API_KEY environment variable.');
  }
  // Complete your AI generation logic here
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { condition, scentPreference, skinType, userInput, useAI = false } = body;

    // ✅ RATE LIMIT CHECK
    const isAiRequest = useAI || (userInput && userInput.length > 30);
    if (isAiRequest) {
      const limiter = getRatelimit();
      if (limiter) {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]
          || request.headers.get('x-real-ip')
          || 'anonymous';
        
        const { success, limit, reset, remaining } = await limiter.limit(ip);
        if (!success) {
          return NextResponse.json(
            {
              error: 'Too many requests. Please wait ~30 seconds.',
              retryAfter: Math.ceil((reset - Date.now()) / 1000),
              limit,
              remaining: 0
            },
            { status: 429 }
          );
        }
      }
    }

    // ✅ GENERATE BLEND DATA
    let blendData;
    let generationMethod = 'rule-based';
    let blendId;

    if (!blendData) {
      // Use rule-based or AI generation based on request
      const oils = ESSENTIAL_OILS.stress || []; // Default fallback
      const { price, xec } = calculatePricing(oils);
      
      blendData = {
        name: getBlendName(condition, userInput),
        description: getBenefits(condition, userInput),
        recipe: transformOilsToRecipe(oils),
        instructions: getInstructions(condition),
        notes: getNotes(condition),
        baseOil: BASE_OILS[skinType] || BASE_OILS.normal,
        price: price,
        xec: xec,
        slug: `${condition || 'default'}-${Date.now()}`
      };
      blendId = blendData.slug;
    }

    // ✅ CHECK AUTHORIZATION BEFORE RETURNING
    const authResult = await verifyUserAuthorization(request, blendData);

    // ✅ Case 1: Not authorized and NOT preview mode → Return 402 Payment Required
    if (!authResult.authorized && !authResult.previewMode) {
      return NextResponse.json(
        {
          error: 'Payment required',
          message: `Hold ${blendData.xec} XEC (≈$${XEC_CONFIG.requiredUsdThreshold} USD) or complete PayPal payment`,
          preview: {
            name: blendData.name,
            description: blendData.description,
            price: blendData.price,
            xec: blendData.xec,
            slug: blendData.slug
          },
          unlockOptions: {
            xec: { required: blendData.xec, usdThreshold: XEC_CONFIG.requiredUsdThreshold },
            paypal: { amount: blendData.price, currency: 'USD' }
          }
        },
        { status: 402 }
      );
    }

    // ✅ Case 2: Preview mode → Return limited data
    if (authResult.previewMode) {
      return NextResponse.json({
        success: true,
        preview: true,
        blend: {
          name: blendData.name,
          description: blendData.description,
          price: blendData.price,
          xec: blendData.xec,
          slug: blendData.slug,
          recipe: null, // Hide recipe
          instructions: null,
          notes: null
        },
        message: 'Preview mode: Unlock with XEC or PayPal to see full recipe'
      });
    }

    // ✅ Case 3: Authorized → Return FULL blend
    return NextResponse.json({
      success: true,
      blend: blendData,
      blendId,
      method: generationMethod,
      authMethod: authResult.method
    }, { status: 200 });

  } catch (error) {
    console.error('Generate blend error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate blend',
        details: error.message,
        suggestion: 'Try a simpler request or check your API configuration'
      },
      { status: 500 }
    );
  }
}

// ✅ Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'emocreations.skin - Blend Generator'
  });
}
