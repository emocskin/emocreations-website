import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { Client } from 'xrpl';

// ✅ 1. Fail-Fast Environment Validation
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("❌ Missing Supabase environment variables. Please check your .env.local file.");
}

const supabase = createClient(
  process.env.SUPABASE_URL,
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
let ratelimit: Ratelimit | undefined;
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

// ✅ BASE_OILS definition (THIS WAS MISSING AND CAUSING THE CRASH)
const BASE_OILS: Record<string, string> = {
  normal: "Jojoba Oil",
  dry: "Sweet Almond Oil",
  oily: "Grapeseed Oil",
  sensitive: "Fractionated Coconut Oil",
};

// ✅✅✅ HELPER: Verify user authorization (XEC balance or Preview mode)
async function verifyUserAuthorization(request: NextRequest, blendData: any) {
  const isPreviewRequest = request.headers.get('x-preview') === 'true';
  if (isPreviewRequest) {
    return { authorized: true, previewMode: true };
  }

  const xrplAddress = request.headers.get('x-xrpl-address');
  if (xrplAddress) {
    let client: Client | null = null;
    try {
      client = new Client('wss://s1.ripple.com:51233');
      
      const connectPromise = client.connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('XRPL connection timeout')), 5000)
      );
      await Promise.race([connectPromise, timeoutPromise]);
      
      const response = await client.request({
        command: 'account_lines',
        account: xrplAddress,
        peer: XEC_CONFIG.issuer,
      });
      
      let xecBalance = 0;
      const trustline = response.result.lines.find(
        (line: any) => line.currency === XEC_CONFIG.currency && line.account === XEC_CONFIG.issuer
      );
      
      if (trustline) {
        xecBalance = Math.abs(parseFloat(trustline.balance));
      }
      
      let xecPriceUsd = 0.46; // Safe fallback
      
      try {
        const ammResponse = await client.request({
          command: 'amm_info',
          asset: { currency: XEC_CONFIG.currency, issuer: XEC_CONFIG.issuer },
          asset2: 'XRP',
          ledger_index: 'validated',
        });

        const pool = ammResponse.result.amm;
        if (pool && pool.amount && pool.amount2) {
          const parseAmount = (amt: any) => {
            if (typeof amt === 'string') return Number(amt) / 1_000_000;
            if (typeof amt === 'object' && amt !== null && amt.value) return Number(amt.value);
            return 0;
          };

          const amt1 = parseAmount(pool.amount);
          const amt2 = parseAmount(pool.amount2);
          
          const isAmt1XRP = typeof pool.amount === 'string';
          const xrpBalance = isAmt1XRP ? amt1 : amt2;
          const xecBalancePool = isAmt1XRP ? amt2 : amt1;

          if (xecBalancePool > 0 && xrpBalance > 0) {
            const xecPriceInXRP = xrpBalance / xecBalancePool;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            try {
              const xrpPriceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd', { signal: controller.signal });
              if (xrpPriceResponse.ok) {
                const xrpData = await xrpPriceResponse.json();
                const xrpUsd = xrpData.ripple?.usd || 0.50;
                const calculatedPrice = xecPriceInXRP * xrpUsd;
                if (calculatedPrice > 0) {
                  xecPriceUsd = calculatedPrice;
                }
              }
            } finally {
              clearTimeout(timeoutId);
            }
          }
        }
      } catch (ammError) {
        console.warn('⚠️ AMM price fetch failed, using fallback price:', ammError);
      }
      
      const priceUsd = Number(blendData.price) || 38;
      const requiredXec = Math.ceil(priceUsd / xecPriceUsd);
      const usdValue = xecBalance * xecPriceUsd;
      
      if (xecBalance >= requiredXec && usdValue >= XEC_CONFIG.requiredUsdThreshold) {
        return { 
          authorized: true, 
          previewMode: false,
          method: 'xec-balance',
          xecBalance,
          usdValue
        };
      } else {
        return { 
          authorized: false, 
          previewMode: false,
          method: 'insufficient-balance'
        };
      }
    } catch (e: any) {
      console.error('❌ XEC balance verification failed:', e.message);
    } finally {
      if (client?.isConnected()) {
        try {
          await client.disconnect();
        } catch (disconnectError) {
          console.warn('Failed to disconnect XRPL client:', disconnectError);
        }
      }
    }
  }

  return { authorized: false, previewMode: false };
}

// ✅✅✅ ULTIMATE ESSENTIAL OIL LIBRARY
const ESSENTIAL_OILS: Record<string, any[]> = {
  default: [
    { name: "Lavender", amount: "10 drops", purpose: "General wellness" },
    { name: "Peppermint", amount: "5 drops", purpose: "Energizing" },
    { name: "Lemon", amount: "5 drops", purpose: "Uplifting" }
  ],
  stress: [
    { name: "Lavender", amount: "10 drops", purpose: "Calms nerves, reduces inflammation" },
    { name: "Roman Chamomile", amount: "8 drops", purpose: "Potent antispasmodic, soothes tissue" },
    { name: "Bergamot FCF", amount: "6 drops", purpose: "Uplifting, zero phototoxicity" }
  ],
  // ... (Keep all your other 150+ conditions here exactly as you had them) ...
};

// ✅ Helper: Transform rule-based oils to frontend format
function transformOilsToRecipe(oils: any[]) {
  return oils.map(oil => {
    const drops = oil.drops !== undefined 
      ? Number(oil.drops) 
      : (parseInt(String(oil.amount || '').replace(/\D/g, ''), 10) || 10);
      
    return {
      oil: oil.name || oil.oil || "Unknown Oil",
      drops: drops,
      purpose: oil.purpose || "Wellness support"
    };
  });
}

// ✅ Helper: Calculate price/xec based on oil count + complexity
function calculatePricing(oils: any[], isAi = false) {
  const basePrice = 38;
  const complexityMultiplier = Math.min(1 + (oils.length - 3) * 0.15, 2.0);
  const price = Math.round(basePrice * complexityMultiplier);
  const xec = Math.ceil(price / 0.46); // Fallback for preview mode
  return { price, xec };
}

// ✅ Helper: Detect condition from extensive alias mapping
function detectCondition(input: string | null | undefined) {
  if (!input || input.trim().length < 3) return null;
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes('stress')) return 'stress';
  if (lowerInput.includes('sleep') || lowerInput.includes('insomnia')) return 'insomnia';
  if (lowerInput.includes('headache')) return 'headache';
  if (lowerInput.includes('muscle')) return 'musclepain';
  if (lowerInput.includes('joint')) return 'joint';
  if (lowerInput.includes('digest')) return 'digestion';
  if (lowerInput.includes('menopause')) return 'menopause';
  
  return null;
}

function getBlendName(condition: string, userInput: string | null = null) {
  const names: Record<string, string> = {
    stress: "Calm Mind Elixir",
    insomnia: "Deep Sleep Serum",
    headache: "Serene Relief Therapy",
    musclepain: "Muscle Ease Blend",
    joint: "Joint Harmony Oil",
    digestion: "Digestive Balance Elixir",
    menopause: "Menopause Balance Blend",
    default: "Custom Wellness Blend"
  };
  return userInput 
    ? `Custom AI Blend: ${userInput.slice(0, 20)}...` 
    : (names[condition] || names.default);
}

function getBenefits(condition: string, userInput: string | null = null) {
  const benefits: Record<string, string> = {
    stress: "Reduces anxiety, calms the nervous system, and promotes emotional resilience.",
    insomnia: "Encourages deep, restorative sleep and eases nighttime restlessness.",
    headache: "Relieves tension headaches and sinus pressure with cooling and anti-inflammatory action.",
    musclepain: "Eases muscle spasms and improves local circulation for faster recovery.",
    joint: "Supports joint mobility and reduces inflammation associated with cartilage stress.",
    digestion: "Aids digestive comfort and reduces bloating through gentle warming action.",
    menopause: "Balances hormonal fluctuations and eases hot flashes with floral synergy.",
  };
  return userInput 
    ? "Personalized support crafted for your unique wellness journey." 
    : (benefits[condition] || "Personalized support for your unique wellness journey.");
}

function getInstructions(condition: string) {
  return "Apply to clean skin with gentle massage. For best results, use after a warm shower when pores are open. Store in a cool, dark place and use within 6 months.";
}

function getNotes(condition: string) {
  let note = "Perform a patch test before first use. This blend is intended as a complementary aromatherapy support and should not replace prescribed medical treatments.";
  if (['headache', 'sciatica', 'migraine', 'nervepain', 'concussion', 'stroke'].includes(condition)) {
    note += " Avoid contact with eyes. If eye contact occurs, flush with a carrier oil, not water.";
  }
  if (['digestion', 'menopause', 'lupus', 'glucose', 'opioid', 'pregnancy', 'diabetes', 'thyroid', 'autoimmune', 'cfs', 'longcovid', 'addiction'].includes(condition)) {
    note += " Consult your healthcare provider before use, especially if pregnant, nursing, or taking medications.";
  }
  return note;
}

// ✅ Poe AI: Generate truly custom blend (fallback)
async function generateAiBlend(userInput: string) {
  if (!poeClient) {
    throw new Error('Poe API not configured. Please set POE_API_KEY environment variable.');
  }
  
  const completion = await poeClient.chat.completions.create({
    model: 'emocreations.skin_ai',
    messages: [{
      role: 'user',
      content: `Create a personalized essential oil blend recipe for: "${userInput}". Return ONLY a JSON object with this exact structure (no markdown, no extra text): { "name": "Creative blend name", "description": "2-3 sentence description of benefits", "recipe": [ {"oil": "Oil name", "drops": number, "purpose": "Why this oil"} ], "instructions": "How to mix and apply", "price": 58, "xec": 103, "slug": "ai-generated-${Date.now()}" }`
    }],
    temperature: 0.7,
    max_tokens: 500,
  });
  
  const responseText = completion.choices?.[0]?.message?.content?.trim() || '{}';
  const cleanJson = responseText.replace(/```json\s*|\s*```/g, '').trim();
  
  let blendData;
  try {
    blendData = JSON.parse(cleanJson);
  } catch (e) {
    throw new Error('Failed to parse AI response as JSON');
  }
  
  if (!blendData.name || !blendData.recipe || !Array.isArray(blendData.recipe)) {
    throw new Error('AI response missing required fields');
  }
  
  return blendData;
}

export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }

    const { condition, scentPreference, skinType, userInput, useAI = false } = body;

    const isAiRequest = useAI || (userInput && userInput.length > 30);
    
    if (isAiRequest) {
      const limiter = getRatelimit();
      if (limiter) {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] 
                 || request.headers.get('x-real-ip') 
                 || 'anonymous';
        
        const { success, limit, reset, remaining } = await limiter.limit(ip);
        
        if (!success) {
          if (supabase) {
            await supabase.from('rate_limit_events').insert({
              ip: ip.slice(0, 45),
              endpoint: '/api/generate-blend',
              rate_limit: limit,
              remaining: 0,
              reset_at: new Date(reset).toISOString(),
              user_agent: request.headers.get('user-agent')?.slice(0, 200),
              created_at: new Date().toISOString()
            }).catch(err => console.warn('Rate limit logging failed:', err));
          }
          
          return NextResponse.json(
            { 
              error: 'Too many AI blend requests. Please wait ~30 seconds and try again.',
              retryAfter: Math.ceil((reset - Date.now()) / 1000),
              limit,
              remaining: 0
            },
            { 
              status: 429,
              headers: {
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': Math.ceil(reset / 1000).toString(),
              }
            }
          );
        }
      }
    }

    let blendData: any;
    let generationMethod = 'rule-based';
    let blendId: string;

    if (isAiRequest) {
      try {
        generationMethod = 'poe-ai';
        blendData = await generateAiBlend(userInput || condition || 'general wellness');
        blendId = blendData.slug || `ai-${Date.now()}`;
      } catch (aiError: any) {
        console.warn('AI generation failed, falling back to rule-based:', aiError.message);
        generationMethod = 'rule-based-fallback';
      }
    }

    if (!blendData) {
      const detectedCondition = detectCondition(userInput || condition);
      const selectedCondition = detectedCondition || condition || 'default';
      
      const oils = ESSENTIAL_OILS[selectedCondition] || ESSENTIAL_OILS.default;
      
      let adjustedOils = oils;
      if (scentPreference === 'citrus') {
        adjustedOils = oils.map((oil: any) => {
          if (oil.name.includes('Bergamot') || oil.name.includes('Lemon')) {
            return oil;
          }
          const currentDrops = parseInt(String(oil.amount || '').replace(/\D/g, ''), 10) || 10;
          const newDrops = Math.max(1, Math.round(currentDrops * 0.8));
          return { ...oil, amount: `${newDrops} drops` };
        });
      }

      const { price, xec } = calculatePricing(adjustedOils);
      
      blendData = {
        name: getBlendName(selectedCondition, userInput),
        description: getBenefits(selectedCondition, userInput),
        recipe: transformOilsToRecipe(adjustedOils),
        instructions: getInstructions(selectedCondition),
        notes: getNotes(selectedCondition),
        baseOil: BASE_OILS[skinType] || BASE_OILS.normal,
        price: price,
        xec: xec,
        slug: `${selectedCondition}-${Date.now()}`
      };
      
      blendId = blendData.slug;
    }

    const authResult = await verifyUserAuthorization(request, blendData);

    if (!authResult.authorized && !authResult.previewMode) {
      return NextResponse.json(
        { 
          error: 'Payment required',
          message: `Hold ${blendData.xec} XEC (≈$${XEC_CONFIG.requiredUsdThreshold} USD) or complete PayPal payment to unlock full blend recipe`,
          preview: {
            name: blendData.name,
            description: blendData.description,
            price: blendData.price,
            xec: blendData.xec,
            slug: blendData.slug
          },
          unlockOptions: {
            xec: {
              required: blendData.xec,
              usdThreshold: XEC_CONFIG.requiredUsdThreshold,
              connectWallet: '/api/unlock-xec'
            },
            paypal: {
              amount: blendData.price,
              currency: 'USD',
              createOrder: '/api/submit-order'
            }
          }
        },
        { status: 402 }
      );
    }

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
          recipe: null,
          instructions: null,
          notes: null,
          baseOil: null
        },
        message: 'Preview mode: Unlock with XEC or PayPal to see full recipe'
      });
    }

    if (supabase) {
      await supabase.from('access_logs').insert({
        action: 'blend_generated',
        method: generationMethod,
        payload: {
          condition,
          detectedCondition: detectCondition(userInput || condition),
          scentPreference,
          skinType,
          userInput: userInput?.slice(0, 200),
          blendId,
          oilCount: blendData.recipe?.length || 0,
          price: blendData.price,
          xec: blendData.xec,
          authMethod: authResult.method || 'unknown'
        },
        created_at: new Date().toISOString()
      }).catch(err => console.warn('Supabase logging failed:', err));
    }

    const headers: Record<string, string> = {};
    const limiter = getRatelimit();
    if (limiter && isAiRequest) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous';
      const { limit, remaining, reset } = await limiter.limit(ip);
      headers['X-RateLimit-Limit'] = limit.toString();
      headers['X-RateLimit-Remaining'] = remaining.toString();
      headers['X-RateLimit-Reset'] = Math.ceil(reset / 1000).toString();
    }

    return NextResponse.json({ 
      success: true, 
      blend: blendData,
      blendId,
      method: generationMethod,
      authMethod: authResult.method || 'unknown'
    }, { status: 200, headers });

  } catch (error: any) {
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

export async function GET() {
  const limiter = getRatelimit();
  return NextResponse.json({
    status: 'ok',
    service: 'emocreations.skin - Blend Generator',
    rateLimiting: {
      enabled: !!limiter,
      limit: 10,
      window: '60s',
      provider: limiter ? 'upstash-redis' : 'none'
    },
    poeConfigured: !!poeClient,
    supabaseConfigured: !!supabase,
    oilLibrarySize: Object.keys(ESSENTIAL_OILS).length,
    timestamp: new Date().toISOString()
  });
}