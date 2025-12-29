// app/api/generate-blend/route.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Supabase client (for logging)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Your actual essential oil library (from receipts + formulations)
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

// Blend name generator
function getBlendName(condition) {
  const names = {
    stress: "Calm Mind Elixir",
    insomnia: "Deep Sleep Serum",
    headache: "Serene Relief Therapy",
    musclepain: "Muscle Ease Blend",
    joint: "Joint Harmony Oil",
    digestion: "Digestive Balance Elixir",
    lupus: "The Unbroken Ointment",
    sciatica: "Deep Relief Sciatic Soother",
    menopause: "Menopause Balance Blend"
  };
  return names[condition] || "Custom Wellness Blend";
}

// Benefits by condition
function getBenefits(condition) {
  const benefits = {
    stress: "Reduces anxiety, calms the nervous system, and promotes emotional resilience.",
    insomnia: "Encourages deep, restorative sleep and eases nighttime restlessness.",
    headache: "Relieves tension headaches and sinus pressure with cooling and anti-inflammatory action.",
    musclepain: "Eases muscle spasms and improves local circulation for faster recovery.",
    joint: "Supports joint mobility and reduces inflammation associated with cartilage stress.",
    digestion: "Aids digestive comfort and reduces bloating through gentle warming action.",
    lupus: "Offers ceremonial support for bodies that carry invisible battles.",
    sciatica: "Targets nerve pain and muscle tension along the sciatic pathway.",
    menopause: "Balances hormonal fluctuations and eases hot flashes with floral synergy."
  };
  return benefits[condition] || "Personalized support for your unique wellness journey.";
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
  if (['digestion', 'menopause', 'lupus'].includes(condition)) {
    note += " Consult your healthcare provider before use, especially if pregnant, nursing, or taking medications.";
  }
  
  return note;
}

export async function POST(request) {
  try {
    const { condition, scentPreference, skinType } = await request.json();

    // Validate input
    if (!condition) {
      return NextResponse.json({ error: 'Condition is required' }, { status: 400 });
    }

    // Select oils
    const oils = ESSENTIAL_OILS[condition] || ESSENTIAL_OILS.default;
    
    // Adjust for scent preference (simplified)
    let adjustedOils = oils;
    if (scentPreference === 'citrus') {
      adjustedOils = oils.map(oil => 
        oil.name.includes('Bergamot') || oil.name.includes('Lemon') ? oil : 
        { ...oil, amount: (parseInt(oil.amount) * 0.8).toFixed(0) + ' drops' }
      );
    }

    // Build blend
    const blendData = {
      blendName: getBlendName(condition),
      baseOil: BASE_OILS[skinType] || BASE_OILS.normal,
      ingredients: adjustedOils,
      benefits: getBenefits(condition),
      instructions: getInstructions(condition),
      notes: getNotes(condition)
    };

    // Generate blend ID
    const blendId = `blend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log to Supabase for trending + agents
    if (supabase) {
      await supabase.from('access_logs').insert({
        action: 'blend_generated',
        payload: { condition, scentPreference, skinType, blendId }
      });
    }

    return NextResponse.json({ blendData, blendId }, { status: 200 });
  } catch (error) {
    console.error('Generate blend error:', error);
    return NextResponse.json({ error: 'Failed to generate blend' }, { status: 500 });
  }
}