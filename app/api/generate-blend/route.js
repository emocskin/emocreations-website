// app/api/generate-blend/route.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

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

// ✅✅✅ COMPLETE ESSENTIAL OIL LIBRARY - ALL 17 CONDITIONS MAPPED
const ESSENTIAL_OILS = {
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
  headache: [
    { name: "Peppermint", amount: "8 drops", purpose: "Cooling pain relief" },
    { name: "Lavender", amount: "10 drops", purpose: "Calms nervous system" },
    { name: "Eucalyptus", amount: "6 drops", purpose: "Opens sinuses, reduces inflammation" }
  ],
  musclepain: [
    { name: "Ginger", amount: "8 drops", purpose: "Warming antispasmodic" },
    { name: "Black Pepper", amount: "8 drops", purpose: "Enhances absorption" },
    { name: "Marjoram", amount: "8 drops", purpose: "Eases abdominal cramping" }
  ],
  joint: [
    { name: "Frankincense", amount: "10 drops", purpose: "Supports tissue integrity" },
    { name: "Helichrysum", amount: "6 drops", purpose: "Nerve repair, pain relief" },
    { name: "Ginger", amount: "6 drops", purpose: "Reduces inflammation" }
  ],
  digestion: [
    { name: "Ginger", amount: "10 drops", purpose: "Improves circulation, aids digestion" },
    { name: "Peppermint", amount: "8 drops", purpose: "Relieves GI discomfort" },
    { name: "Fennel", amount: "6 drops", purpose: "Reduces bloating" }
  ],
  lupus: [
    { name: "Lavender", amount: "10 drops", purpose: "Anti-inflammatory" },
    { name: "Frankincense", amount: "10 drops", purpose: "Modulates inflammation" },
    { name: "Helichrysum", amount: "8 drops", purpose: "Tissue trauma repair" }
  ],
  sciatica: [
    { name: "Wintergreen", amount: "8 drops", purpose: "Natural analgesic" },
    { name: "Helichrysum", amount: "8 drops", purpose: "Nerve-regenerative" },
    { name: "Marjoram", amount: "10 drops", purpose: "Muscle relaxant" }
  ],
  menopause: [
    { name: "Clary Sage", amount: "10 drops", purpose: "Balances hormones" },
    { name: "Geranium", amount: "8 drops", purpose: "Reduces hot flashes" },
    { name: "Ylang Ylang", amount: "6 drops", purpose: "Emotional balance" }
  ],
  shoulder: [
    { name: "Lavender", amount: "8 drops", purpose: "Relieves tension" },
    { name: "Peppermint", amount: "6 drops", purpose: "Cooling pain relief" },
    { name: "Rosemary", amount: "6 drops", purpose: "Improves circulation" }
  ],
  glucose: [
    { name: "Cinnamon", amount: "6 drops", purpose: "Supports healthy glucose metabolism" },
    { name: "Ginger", amount: "8 drops", purpose: "Improves circulation" },
    { name: "Lemon", amount: "6 drops", purpose: "Antioxidant support" }
  ],
  metabolism: [
    { name: "Grapefruit", amount: "8 drops", purpose: "Supports healthy metabolism" },
    { name: "Peppermint", amount: "6 drops", purpose: "Energizing, reduces cravings" },
    { name: "Ginger", amount: "6 drops", purpose: "Thermogenic, aids digestion" }
  ],
  opioid: [
    { name: "Lavender", amount: "10 drops", purpose: "Calms withdrawal anxiety" },
    { name: "Frankincense", amount: "8 drops", purpose: "Supports emotional healing" },
    { name: "Bergamot FCF", amount: "6 drops", purpose: "Uplifts mood, reduces cravings" }
  ],
  'blood-type-a': [
    { name: "Lavender", amount: "10 drops", purpose: "Calms sensitive digestion" },
    { name: "Chamomile", amount: "8 drops", purpose: "Soothes stress response" },
    { name: "Ylang Ylang", amount: "6 drops", purpose: "Balances emotions" }
  ],
  telomere: [
    { name: "Frankincense", amount: "10 drops", purpose: "Cellular support, anti-aging" },
    { name: "Helichrysum", amount: "8 drops", purpose: "Tissue regeneration" },
    { name: "Myrrh", amount: "6 drops", purpose: "Antioxidant protection" }
  ],
  unbroken: [
    { name: "Lavender", amount: "10 drops", purpose: "Calms chronic pain" },
    { name: "Frankincense", amount: "10 drops", purpose: "Supports resilience" },
    { name: "Helichrysum", amount: "8 drops", purpose: "Tissue trauma repair" }
  ],
  queen: [
    { name: "Rose", amount: "5 drops", purpose: "Promotes self-love, balances hormones" },
    { name: "Ylang Ylang", amount: "7 drops", purpose: "Enhances confidence, reduces stress" },
    { name: "Geranium", amount: "6 drops", purpose: "Supports emotional balance" }
  ],
  king: [
    { name: "Cedarwood", amount: "8 drops", purpose: "Grounding, promotes strength" },
    { name: "Frankincense", amount: "8 drops", purpose: "Supports leadership energy" },
    { name: "Pine", amount: "6 drops", purpose: "Invigorating, clears mind" }
  ],
  // ✅ Fallback for unmatched conditions
  default: [
    { name: "Lavender", amount: "10 drops", purpose: "Universal calming agent" },
    { name: "Frankincense", amount: "8 drops", purpose: "Cellular support" },
    { name: "Bergamot FCF", amount: "6 drops", purpose: "Mood elevation" }
  ]
};

// Base oils by skin type
const BASE_OILS = {
  normal: "Sweet Almond Oil",
  dry: "Avocado Oil",
  oily: "Grapeseed Oil",
  sensitive: "Jojoba Oil",
  combination: "Fractionated Coconut Oil"
};

// ✅ Helper: Transform rule-based oils to frontend format
function transformOilsToRecipe(oils) {
  return oils.map(oil => {
    const drops = parseInt(oil.amount) || 10;
    return {
      oil: oil.name,
      drops: drops,
      purpose: oil.purpose
    };
  });
}

// ✅ Helper: Calculate price/xec based on oil count + complexity
function calculatePricing(oils, isAi = false) {
  const basePrice = 38;
  const complexityMultiplier = Math.min(1 + (oils.length - 3) * 0.15, 2.0);
  const price = Math.round(basePrice * complexityMultiplier);
  const xec = Math.ceil(price / 0.37);
  return { price, xec };
}

// Blend name generator
function getBlendName(condition, userInput = null) {
  const names = {
    stress: "Calm Mind Elixir",
    insomnia: "Deep Sleep Serum",
    headache: "Serene Relief Therapy",
    musclepain: "Muscle Ease Blend",
    joint: "Joint Harmony Oil",
    digestion: "Digestive Balance Elixir",
    lupus: "The Unbroken Ointment",
    sciatica: "Deep Relief Sciatic Soother",
    menopause: "Menopause Balance Blend",
    shoulder: "Shoulder Freedom Floral Therapy",
    glucose: "Glucose Balance Circulation Therapy",
    metabolism: "Metabolism Boost Elixir",
    opioid: "Opioid Recovery Blend",
    'blood-type-a': "Blood Type A Blend",
    telomere: "Telomere Repair Serum",
    unbroken: "The Unbroken Ointment",
    queen: "Queen's Oil",
    king: "The King's Oil",
    xe: "XE – Everybody's Oil"
  };
  return userInput 
    ? `Custom AI Blend: ${userInput.slice(0, 20)}...` 
    : (names[condition] || "Custom Wellness Blend");
}

// Benefits by condition
function getBenefits(condition, userInput = null) {
  const benefits = {
    stress: "Reduces anxiety, calms the nervous system, and promotes emotional resilience.",
    insomnia: "Encourages deep, restorative sleep and eases nighttime restlessness.",
    headache: "Relieves tension headaches and sinus pressure with cooling and anti-inflammatory action.",
    musclepain: "Eases muscle spasms and improves local circulation for faster recovery.",
    joint: "Supports joint mobility and reduces inflammation associated with cartilage stress.",
    digestion: "Aids digestive comfort and reduces bloating through gentle warming action.",
    lupus: "Offers ceremonial support for bodies that carry invisible battles.",
    sciatica: "Targets nerve pain and muscle tension along the sciatic pathway.",
    menopause: "Balances hormonal fluctuations and eases hot flashes with floral synergy.",
    shoulder: "Releases shoulder tension and restores freedom of movement.",
    glucose: "Supports healthy glucose metabolism and circulation.",
    metabolism: "Energizes metabolism and supports healthy weight management.",
    opioid: "Supports emotional healing and reduces cravings during recovery.",
    'blood-type-a': "Gentle support for Type A sensitive constitution.",
    telomere: "Cellular support for healthy aging and longevity.",
    unbroken: "Honors your resilience through chronic illness challenges.",
    queen: "Empowers self-love, confidence, and divine feminine energy.",
    king: "Strengthens leadership, grounding, and divine masculine energy."
  };
  return userInput 
    ? "Personalized support crafted for your unique wellness journey." 
    : (benefits[condition] || "Personalized support for your unique wellness journey.");
}

// Instructions by condition
function getInstructions(condition) {
  return "Apply to clean skin with gentle massage. For best results, use after a warm shower when pores are open. Store in a cool, dark place and use within 6 months.";
}

// Notes (compliant)
function getNotes(condition) {
  let note = "Perform a patch test before first use. This blend is intended as a complementary aromatherapy support and should not replace prescribed medical treatments.";
  
  if (condition === 'headache' || condition === 'sciatica') {
    note += " Avoid contact with eyes. If eye contact occurs, flush with a carrier oil, not water.";
  }
  if (['digestion', 'menopause', 'lupus', 'glucose', 'opioid'].includes(condition)) {
    note += " Consult your healthcare provider before use, especially if pregnant, nursing, or taking medications.";
  }
  
  return note;
}

// ✅ Poe AI: Generate truly custom blend (fallback)
async function generateAiBlend(userInput) {
  if (!poeClient) {
    throw new Error('Poe API not configured. Please set POE_API_KEY environment variable.');
  }

  const completion = await poeClient.chat.completions.create({
    model: 'emocreations.skin_ai',
    messages: [{
      role: 'user',
      content: `Create a personalized essential oil blend recipe for: "${userInput}". 
      Return ONLY a JSON object with this exact structure (no markdown, no extra text):
      {
        "name": "Creative blend name",
        "description": "2-3 sentence description of benefits",
        "recipe": [
          {"oil": "Oil name", "drops": number, "purpose": "Why this oil"},
          {"oil": "Oil name", "drops": number, "purpose": "Why this oil"}
        ],
        "instructions": "How to mix and apply",
        "price": 58,
        "xec": 103,
        "slug": "ai-generated-" + Date.now()
      }`
    }],
    temperature: 0.7,
    max_tokens: 500,
  });

  const responseText = completion.choices[0].message.content.trim();
  const cleanJson = responseText.replace(/```json\s*|\s*```/g, '').trim();
  const blendData = JSON.parse(cleanJson);

  if (!blendData.name || !blendData.recipe || !Array.isArray(blendData.recipe)) {
    throw new Error('AI response missing required fields');
  }

  return blendData;
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    const {
      condition,
      scentPreference,
      skinType,
      userInput,
      useAI = false
    } = body;

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
          if (supabase) {
            const { error: rateLimitError } = await supabase.from('rate_limit_events').insert({
              ip: ip.slice(0, 45),
              endpoint: '/api/generate-blend',
              rate_limit: limit,
              remaining: 0,
              reset_at: new Date(reset).toISOString(),
              user_agent: request.headers.get('user-agent')?.slice(0, 200),
              created_at: new Date().toISOString()
            });
            
            if (rateLimitError) {
              console.warn('Rate limit logging failed:', rateLimitError);
            }
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

    let blendData;
    let generationMethod = 'rule-based';
    let blendId;

    // ✅ Option 1: Poe AI generation
    if (isAiRequest) {
      try {
        generationMethod = 'poe-ai';
        blendData = await generateAiBlend(userInput || condition);
        blendId = blendData.slug || `ai-${Date.now()}`;
      } catch (aiError) {
        console.warn('AI generation failed, falling back to rule-based:', aiError);
        generationMethod = 'rule-based-fallback';
      }
    }

    // ✅ Option 2: Rule-based generation (default or fallback)
    if (!blendData) {
      // ✅ FIX: Use condition from frontend, fallback to 'default' only if truly empty
      const selectedCondition = condition || 'default';
      
      // ✅ FIX: Get oils for the SPECIFIC condition (not just default)
      const oils = ESSENTIAL_OILS[selectedCondition] || ESSENTIAL_OILS.default;
      
      // Debug log to verify condition is being received
      console.log('🔍 Condition received:', condition);
      console.log('🔍 Selected condition:', selectedCondition);
      console.log('🔍 Oils found:', oils ? 'YES' : 'NO', '- Using:', selectedCondition);
      
      let adjustedOils = oils;
      if (scentPreference === 'citrus') {
        adjustedOils = oils.map(oil => 
          oil.name.includes('Bergamot') || oil.name.includes('Lemon') ? oil : 
          { ...oil, amount: (parseInt(oil.amount) * 0.8).toFixed(0) + ' drops' }
        );
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

    // ✅ Log to Supabase
    if (supabase) {
      const { error: logError } = await supabase.from('access_logs').insert({
        action: 'blend_generated',
        method: generationMethod,
        payload: {
          condition,
          scentPreference,
          skinType,
          userInput: userInput?.slice(0, 200),
          blendId,
          oilCount: blendData.recipe?.length || 0,
          price: blendData.price,
          xec: blendData.xec
        },
        created_at: new Date().toISOString()
      });
      
      if (logError) {
        console.warn('Supabase logging failed:', logError);
      }
    }

    const headers = {};
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
      method: generationMethod
    }, { status: 200, headers });

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
