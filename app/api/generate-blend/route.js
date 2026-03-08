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

// ✅✅✅ ULTIMATE ESSENTIAL OIL LIBRARY - 150+ CONDITIONS
const ESSENTIAL_OILS = {
  // === PAIN & INFLAMMATION (25 conditions) ===
  headache: [
    { name: "Peppermint", amount: "8 drops", purpose: "Cooling pain relief" },
    { name: "Lavender", amount: "10 drops", purpose: "Calms nervous system" },
    { name: "Eucalyptus", amount: "6 drops", purpose: "Opens sinuses, reduces inflammation" }
  ],
  migraine: [
    { name: "Peppermint", amount: "10 drops", purpose: "Reduces migraine intensity" },
    { name: "Lavender", amount: "10 drops", purpose: "Calms pain signals" },
    { name: "Rosemary", amount: "6 drops", purpose: "Improves circulation to head" }
  ],
  tension: [
    { name: "Lavender", amount: "10 drops", purpose: "Releases physical tension" },
    { name: "Marjoram", amount: "8 drops", purpose: "Muscle relaxant" },
    { name: "Bergamot FCF", amount: "6 drops", purpose: "Eases emotional tension" }
  ],
  musclepain: [
    { name: "Ginger", amount: "8 drops", purpose: "Warming antispasmodic" },
    { name: "Black Pepper", amount: "8 drops", purpose: "Enhances absorption" },
    { name: "Marjoram", amount: "8 drops", purpose: "Eases muscle cramping" }
  ],
  soreness: [
    { name: "Ginger", amount: "8 drops", purpose: "Reduces post-exercise soreness" },
    { name: "Lavender", amount: "8 drops", purpose: "Anti-inflammatory" },
    { name: "Peppermint", amount: "6 drops", purpose: "Cooling relief" }
  ],
  joint: [
    { name: "Frankincense", amount: "10 drops", purpose: "Supports tissue integrity" },
    { name: "Helichrysum", amount: "6 drops", purpose: "Nerve repair, pain relief" },
    { name: "Ginger", amount: "6 drops", purpose: "Reduces inflammation" }
  ],
  arthritis: [
    { name: "Frankincense", amount: "10 drops", purpose: "Anti-inflammatory" },
    { name: "Myrrh", amount: "8 drops", purpose: "Joint lubrication support" },
    { name: "Ginger", amount: "6 drops", purpose: "Warming pain relief" }
  ],
  sciatica: [
    { name: "Wintergreen", amount: "8 drops", purpose: "Natural analgesic" },
    { name: "Helichrysum", amount: "8 drops", purpose: "Nerve-regenerative" },
    { name: "Marjoram", amount: "10 drops", purpose: "Muscle relaxant" }
  ],
  nervepain: [
    { name: "Helichrysum", amount: "10 drops", purpose: "Nerve repair" },
    { name: "Lavender", amount: "8 drops", purpose: "Calms nerve signals" },
    { name: "Frankincense", amount: "6 drops", purpose: "Anti-inflammatory" }
  ],
  neuropathy: [
    { name: "Helichrysum", amount: "10 drops", purpose: "Supports nerve health" },
    { name: "Ginger", amount: "8 drops", purpose: "Improves circulation" },
    { name: "Peppermint", amount: "6 drops", purpose: "Cooling sensation" }
  ],
  backpain: [
    { name: "Ginger", amount: "8 drops", purpose: "Warming pain relief" },
    { name: "Black Pepper", amount: "8 drops", purpose: "Increases circulation" },
    { name: "Lavender", amount: "8 drops", purpose: "Relaxes tense muscles" }
  ],
  neckpain: [
    { name: "Peppermint", amount: "8 drops", purpose: "Cooling relief" },
    { name: "Lavender", amount: "8 drops", purpose: "Releases tension" },
    { name: "Rosemary", amount: "6 drops", purpose: "Improves circulation" }
  ],
  shoulder: [
    { name: "Lavender", amount: "8 drops", purpose: "Relieves tension" },
    { name: "Peppermint", amount: "6 drops", purpose: "Cooling pain relief" },
    { name: "Rosemary", amount: "6 drops", purpose: "Improves circulation" }
  ],
  knee: [
    { name: "Frankincense", amount: "10 drops", purpose: "Joint support" },
    { name: "Ginger", amount: "8 drops", purpose: "Anti-inflammatory" },
    { name: "Orange", amount: "6 drops", purpose: "Uplifting, circulation" }
  ],
  injury: [
    { name: "Helichrysum", amount: "10 drops", purpose: "Tissue repair" },
    { name: "Lavender", amount: "8 drops", purpose: "Pain relief" },
    { name: "Frankincense", amount: "6 drops", purpose: "Cellular regeneration" }
  ],
  sprain: [
    { name: "Helichrysum", amount: "10 drops", purpose: "Reduces bruising" },
    { name: "Lavender", amount: "8 drops", purpose: "Pain relief" },
    { name: "Peppermint", amount: "6 drops", purpose: "Cooling" }
  ],
  strain: [
    { name: "Ginger", amount: "8 drops", purpose: "Warming relief" },
    { name: "Marjoram", amount: "8 drops", purpose: "Muscle relaxant" },
    { name: "Lavender", amount: "6 drops", purpose: "Anti-inflammatory" }
  ],
  tendonitis: [
    { name: "Helichrysum", amount: "10 drops", purpose: "Tendon repair" },
    { name: "Frankincense", amount: "8 drops", purpose: "Anti-inflammatory" },
    { name: "Lavender", amount: "6 drops", purpose: "Pain relief" }
  ],
  bursitis: [
    { name: "Frankincense", amount: "10 drops", purpose: "Reduces inflammation" },
    { name: "Lavender", amount: "8 drops", purpose: "Pain relief" },
    { name: "Ginger", amount: "6 drops", purpose: "Warming circulation" }
  ],
  plantar: [
    { name: "Peppermint", amount: "10 drops", purpose: "Cooling foot relief" },
    { name: "Lavender", amount: "8 drops", purpose: "Anti-inflammatory" },
    { name: "Eucalyptus", amount: "6 drops", purpose: "Circulation" }
  ],
  carpal: [
    { name: "Peppermint", amount: "8 drops", purpose: "Cooling wrist relief" },
    { name: "Lavender", amount: "8 drops", purpose: "Anti-inflammatory" },
    { name: "Frankincense", amount: "6 drops", purpose: "Tissue support" }
  ],
  fibromyalgia: [
    { name: "Lavender", amount: "10 drops", purpose: "Pain relief" },
    { name: "Marjoram", amount: "8 drops", purpose: "Muscle relaxant" },
    { name: "Frankincense", amount: "6 drops", purpose: "Anti-inflammatory" }
  ],
  chronic_pain: [
    { name: "Frankincense", amount: "10 drops", purpose: "Chronic pain support" },
    { name: "Lavender", amount: "8 drops", purpose: "Nervous system calm" },
    { name: "Helichrysum", amount: "6 drops", purpose: "Tissue repair" }
  ],
  inflammation: [
    { name: "Frankincense", amount: "10 drops", purpose: "Systemic inflammation" },
    { name: "Turmeric", amount: "8 drops", purpose: "Powerful anti-inflammatory" },
    { name: "Lavender", amount: "6 drops", purpose: "Calming" }
  ],
  swelling: [
    { name: "Cypress", amount: "10 drops", purpose: "Reduces fluid retention" },
    { name: "Lavender", amount: "8 drops", purpose: "Anti-inflammatory" },
    { name: "Peppermint", amount: "6 drops", purpose: "Cooling" }
  ],
  
  // === STRESS & EMOTIONS (20 conditions) ===
  stress: [
    { name: "Lavender", amount: "10 drops", purpose: "Calms nerves, reduces inflammation" },
    { name: "Roman Chamomile", amount: "8 drops", purpose: "Potent antispasmodic, soothes tissue" },
    { name: "Bergamot FCF", amount: "6 drops", purpose: "Uplifting, zero phototoxicity" }
  ],
  anxiety: [
    { name: "Lavender", amount: "10 drops", purpose: "Reduces anxiety" },
    { name: "Bergamot FCF", amount: "8 drops", purpose: "Calms without sedation" },
    { name: "Ylang Ylang", amount: "6 drops", purpose: "Slows racing heart" }
  ],
  panic: [
    { name: "Lavender", amount: "12 drops", purpose: "Calms panic response" },
    { name: "Bergamot FCF", amount: "8 drops", purpose: "Reduces hyperventilation" },
    { name: "Frankincense", amount: "6 drops", purpose: "Deepens breathing" }
  ],
  depression: [
    { name: "Bergamot FCF", amount: "10 drops", purpose: "Uplifts mood" },
    { name: "Ylang Ylang", amount: "8 drops", purpose: "Balances emotions" },
    { name: "Grapefruit", amount: "6 drops", purpose: "Energizing, positive" }
  ],
  mood: [
    { name: "Bergamot FCF", amount: "10 drops", purpose: "Balances mood" },
    { name: "Lavender", amount: "8 drops", purpose: "Calms emotions" },
    { name: "Sweet Orange", amount: "6 drops", purpose: "Uplifting" }
  ],
  anger: [
    { name: "Bergamot FCF", amount: "10 drops", purpose: "Cools anger" },
    { name: "Lavender", amount: "8 drops", purpose: "Calms reactivity" },
    { name: "Roman Chamomile", amount: "6 drops", purpose: "Soothes irritation" }
  ],
  grief: [
    { name: "Rose", amount: "5 drops", purpose: "Heart healing" },
    { name: "Frankincense", amount: "8 drops", purpose: "Supports emotional processing" },
    { name: "Lavender", amount: "8 drops", purpose: "Comforting" }
  ],
  trauma: [
    { name: "Lavender", amount: "10 drops", purpose: "Calms nervous system" },
    { name: "Frankincense", amount: "8 drops", purpose: "Supports healing" },
    { name: "Roman Chamomile", amount: "6 drops", purpose: "Soothes shock" }
  ],
  overwhelm: [
    { name: "Lavender", amount: "10 drops", purpose: "Calms overwhelm" },
    { name: "Cedarwood", amount: "8 drops", purpose: "Grounding" },
    { name: "Bergamot FCF", amount: "6 drops", purpose: "Lightens mood" }
  ],
  burnout: [
    { name: "Lavender", amount: "10 drops", purpose: "Restores calm" },
    { name: "Ylang Ylang", amount: "8 drops", purpose: "Rebalances" },
    { name: "Frankincense", amount: "6 drops", purpose: "Deepens rest" }
  ],
  fatigue: [
    { name: "Peppermint", amount: "8 drops", purpose: "Energizing" },
    { name: "Rosemary", amount: "8 drops", purpose: "Mental clarity" },
    { name: "Lemon", amount: "6 drops", purpose: "Uplifting" }
  ],
  exhaustion: [
    { name: "Peppermint", amount: "8 drops", purpose: "Energy boost" },
    { name: "Rosemary", amount: "8 drops", purpose: "Mental fatigue" },
    { name: "Grapefruit", amount: "6 drops", purpose: "Uplifting" }
  ],
  irritability: [
    { name: "Bergamot FCF", amount: "10 drops", purpose: "Calms irritability" },
    { name: "Lavender", amount: "8 drops", purpose: "Soothes" },
    { name: "Roman Chamomile", amount: "6 drops", purpose: "Gentle calming" }
  ],
  frustration: [
    { name: "Bergamot FCF", amount: "10 drops", purpose: "Releases frustration" },
    { name: "Lavender", amount: "8 drops", purpose: "Calms" },
    { name: "Ylang Ylang", amount: "6 drops", purpose: "Balances" }
  ],
  loneliness: [
    { name: "Rose", amount: "5 drops", purpose: "Heart comfort" },
    { name: "Lavender", amount: "8 drops", purpose: "Calming" },
    { name: "Bergamot FCF", amount: "6 drops", purpose: "Uplifting" }
  ],
  sadness: [
    { name: "Bergamot FCF", amount: "10 drops", purpose: "Uplifts" },
    { name: "Ylang Ylang", amount: "8 drops", purpose: "Emotional balance" },
    { name: "Lavender", amount: "6 drops", purpose: "Comfort" }
  ],
  fear: [
    { name: "Lavender", amount: "10 drops", purpose: "Calms fear" },
    { name: "Frankincense", amount: "8 drops", purpose: "Grounding" },
    { name: "Cedarwood", amount: "6 drops", purpose: "Stability" }
  ],
  worry: [
    { name: "Lavender", amount: "10 drops", purpose: "Calms worry" },
    { name: "Bergamot FCF", amount: "8 drops", purpose: "Eases mind" },
    { name: "Cedarwood", amount: "6 drops", purpose: "Grounding" }
  ],
  shock: [
    { name: "Lavender", amount: "10 drops", purpose: "Calms shock" },
    { name: "Frankincense", amount: "8 drops", purpose: "Stabilizing" },
    { name: "Roman Chamomile", amount: "6 drops", purpose: "Soothing" }
  ],
  emotional: [
    { name: "Lavender", amount: "10 drops", purpose: "Emotional balance" },
    { name: "Bergamot FCF", amount: "8 drops", purpose: "Mood support" },
    { name: "Ylang Ylang", amount: "6 drops", purpose: "Heart opening" }
  ],
  
  // === SLEEP (10 conditions) ===
  insomnia: [
    { name: "Lavender", amount: "12 drops", purpose: "Promotes restful sleep" },
    { name: "Ylang Ylang", amount: "6 drops", purpose: "Sedative, balances emotions" },
    { name: "Cedarwood", amount: "6 drops", purpose: "Grounding, promotes focus" }
  ],
  sleep: [
    { name: "Lavender", amount: "12 drops", purpose: "Sleep induction" },
    { name: "Cedarwood", amount: "8 drops", purpose: "Sedative" },
    { name: "Roman Chamomile", amount: "6 drops", purpose: "Calming" }
  ],
  restless: [
    { name: "Lavender", amount: "10 drops", purpose: "Calms restlessness" },
    { name: "Vetiver", amount: "8 drops", purpose: "Deeply grounding" },
    { name: "Cedarwood", amount: "6 drops", purpose: "Stabilizing" }
  ],
  nightmares: [
    { name: "Lavender", amount: "10 drops", purpose: "Peaceful sleep" },
    { name: "Frankincense", amount: "8 drops", purpose: "Spiritual protection" },
    { name: "Cedarwood", amount: "6 drops", purpose: "Grounding" }
  ],
  sleeplessness: [
    { name: "Lavender", amount: "12 drops", purpose: "Induces sleep" },
    { name: "Cedarwood", amount: "8 drops", purpose: "Sedative" },
    { name: "Vetiver", amount: "6 drops", purpose: "Deeply calming" }
  ],
  jetlag: [
    { name: "Lavender", amount: "10 drops", purpose: "Regulates sleep" },
    { name: "Peppermint", amount: "8 drops", purpose: "Alertness when needed" },
    { name: "Lemon", amount: "6 drops", purpose: "Resets circadian" }
  ],
  shiftwork: [
    { name: "Lavender", amount: "10 drops", purpose: "Sleep support" },
    { name: "Peppermint", amount: "8 drops", purpose: "Wakefulness" },
    { name: "Rosemary", amount: "6 drops", purpose: "Mental clarity" }
  ],
  apnea: [
    { name: "Lavender", amount: "10 drops", purpose: "Relaxation" },
    { name: "Frankincense", amount: "8 drops", purpose: "Deep breathing" },
    { name: "Cedarwood", amount: "6 drops", purpose: "Grounding" }
  ],
  snoring: [
    { name: "Lavender", amount: "10 drops", purpose: "Relaxation" },
    { name: "Eucalyptus", amount: "8 drops", purpose: "Opens airways" },
    { name: "Cedarwood", amount: "6 drops", purpose: "Grounding" }
  ],
  dreams: [
    { name: "Lavender", amount: "10 drops", purpose: "Peaceful sleep" },
    { name: "Frankincense", amount: "8 drops", purpose: "Spiritual connection" },
    { name: "Sandalwood", amount: "6 drops", purpose: "Dream enhancement" }
  ],
  
  // === HORMONAL & REPRODUCTIVE (20 conditions) ===
  menopause: [
    { name: "Clary Sage", amount: "10 drops", purpose: "Balances hormones" },
    { name: "Geranium", amount: "8 drops", purpose: "Reduces hot flashes" },
    { name: "Ylang Ylang", amount: "6 drops", purpose: "Emotional balance" }
  ],
  hotflash: [
    { name: "Clary Sage", amount: "10 drops", purpose: "Regulates temperature" },
    { name: "Peppermint", amount: "8 drops", purpose: "Cooling" },
    { name: "Geranium", amount: "6 drops", purpose: "Hormone balancing" }
  ],
  pms: [
    { name: "Clary Sage", amount: "10 drops", purpose: "Hormone regulation" },
    { name: "Lavender", amount: "8 drops", purpose: "Cramp relief" },
    { name: "Geranium", amount: "6 drops", purpose: "Mood support" }
  ],
  cramps: [
    { name: "Clary Sage", amount: "10 drops", purpose: "Antispasmodic" },
    { name: "Marjoram", amount: "8 drops", purpose: "Muscle relaxant" },
    { name: "Lavender", amount: "6 drops", purpose: "Pain relief" }
  ],
  period: [
    { name: "Clary Sage", amount: "10 drops", purpose: "Hormone balance" },
    { name: "Lavender", amount: "8 drops", purpose: "Cramp relief" },
    { name: "Geranium", amount: "6 drops", purpose: "Emotional support" }
  ],
  endometriosis: [
    { name: "Clary Sage", amount: "10 drops", purpose: "Hormone modulation" },
    { name: "Helichrysum", amount: "8 drops", purpose: "Pain relief" },
    { name: "Lavender", amount: "6 drops", purpose: "Anti-inflammatory" }
  ],
  pcos: [
    { name: "Clary Sage", amount: "10 drops", purpose: "Insulin sensitivity" },
    { name: "Geranium", amount: "8 drops", purpose: "Hormone balance" },
    { name: "Cypress", amount: "6 drops", purpose: "Lymphatic support" }
  ],
  fertility: [
    { name: "Clary Sage", amount: "8 drops", purpose: "Hormone balance" },
    { name: "Geranium", amount: "8 drops", purpose: "Reproductive support" },
    { name: "Ylang Ylang", amount: "6 drops", purpose: "Relaxation" }
  ],
  pregnancy: [
    { name: "Lavender", amount: "8 drops", purpose: "Calming (safe in pregnancy)" },
    { name: "Frankincense", amount: "6 drops", purpose: "Grounding" },
    { name: "Sweet Orange", amount: "6 drops", purpose: "Uplifting, reduces nausea" }
  ],
  postpartum: [
    { name: "Lavender", amount: "10 drops", purpose: "Healing, calming" },
    { name: "Frankincense", amount: "8 drops", purpose: "Tissue repair" },
    { name: "Sweet Orange", amount: "6 drops", purpose: "Mood support" }
  ],
  libido: [
    { name: "Ylang Ylang", amount: "10 drops", purpose: "Aphrodisiac" },
    { name: "Sandalwood", amount: "8 drops", purpose: "Sensual grounding" },
    { name: "Jasmine", amount: "6 drops", purpose: "Confidence boosting" }
  ],
  impotence: [
    { name: "Ylang Ylang", amount: "10 drops", purpose: "Confidence" },
    { name: "Sandalwood", amount: "8 drops", purpose: "Grounding" },
    { name: "Ginger", amount: "6 drops", purpose: "Circulation" }
  ],
  infertility: [
    { name: "Clary Sage", amount: "8 drops", purpose: "Hormone balance" },
    { name: "Geranium", amount: "8 drops", purpose: "Reproductive support" },
    { name: "Frankincense", amount: "6 drops", purpose: "Cellular health" }
  ],
  miscarriage: [
    { name: "Rose", amount: "5 drops", purpose: "Heart healing" },
    { name: "Lavender", amount: "8 drops", purpose: "Comfort" },
    { name: "Frankincense", amount: "6 drops", purpose: "Grief support" }
  ],
  abortion: [
    { name: "Lavender", amount: "10 drops", purpose: "Physical healing" },
    { name: "Frankincense", amount: "8 drops", purpose: "Emotional support" },
    { name: "Rose", amount: "6 drops", purpose: "Heart comfort" }
  ],
  breastfeeding: [
    { name: "Lavender", amount: "8 drops", purpose: "Calming (safe)" },
    { name: "Frankincense", amount: "6 drops", purpose: "Healing" },
    { name: "Sweet Orange", amount: "6 drops", purpose: "Uplifting" }
  ],
  lactation: [
    { name: "Fennel", amount: "8 drops", purpose: "Supports milk production" },
    { name: "Lavender", amount: "8 drops", purpose: "Relaxation" },
    { name: "Sweet Orange", amount: "6 drops", purpose: "Mood support" }
  ],
  mastitis: [
    { name: "Lavender", amount: "10 drops", purpose: "Anti-inflammatory" },
    { name: "Peppermint", amount: "8 drops", purpose: "Cooling relief" },
    { name: "Frankincense", amount: "6 drops", purpose: "Healing" }
  ],
  prostate: [
    { name: "Frankincense", amount: "10 drops", purpose: "Prostate support" },
    { name: "Sandalwood", amount: "8 drops", purpose: "Urinary support" },
    { name: "Cypress", amount: "6 drops", purpose: "Circulation" }
  ],
  ed: [
    { name: "Ylang Ylang", amount: "10 drops", purpose: "Confidence" },
    { name: "Ginger", amount: "8 drops", purpose: "Circulation" },
    { name: "Cedarwood", amount: "6 drops", purpose: "Grounding" }
  ],
  
  // === DIGESTIVE (15 conditions) ===
  digestion: [
    { name: "Ginger", amount: "10 drops", purpose: "Improves circulation, aids digestion" },
    { name: "Peppermint", amount: "8 drops", purpose: "Relieves GI discomfort" },
    { name: "Fennel", amount: "6 drops", purpose: "Reduces bloating" }
  ],
  bloating: [
    { name: "Ginger", amount: "10 drops", purpose: "Reduces bloating" },
    { name: "Peppermint", amount: "8 drops", purpose: "Carminative" },
    { name: "Fennel", amount: "6 drops", purpose: "Anti-gas" }
  ],
  nausea: [
    { name: "Ginger", amount: "10 drops", purpose: "Anti-nausea" },
    { name: "Peppermint", amount: "8 drops", purpose: "Settles stomach" },
    { name: "Lemon", amount: "6 drops", purpose: "Fresh, reduces queasiness" }
  ],
  ibs: [
    { name: "Peppermint", amount: "10 drops", purpose: "Antispasmodic" },
    { name: "Ginger", amount: "8 drops", purpose: "Anti-inflammatory" },
    { name: "Fennel", amount: "6 drops", purpose: "Digestive support" }
  ],
  constipation: [
    { name: "Ginger", amount: "10 drops", purpose: "Stimulates digestion" },
    { name: "Fennel", amount: "8 drops", purpose: "Gentle laxative" },
    { name: "Black Pepper", amount: "6 drops", purpose: "Warming, motility" }
  ],
  diarrhea: [
    { name: "Ginger", amount: "10 drops", purpose: "Settles digestion" },
    { name: "Peppermint", amount: "8 drops", purpose: "Antispasmodic" },
    { name: "Chamomile", amount: "6 drops", purpose: "Soothing" }
  ],
  heartburn: [
    { name: "Ginger", amount: "10 drops", purpose: "Reduces acid reflux" },
    { name: "Peppermint", amount: "8 drops", purpose: "Cooling (use cautiously)" },
    { name: "Fennel", amount: "6 drops", purpose: "Digestive soothing" }
  ],
  gerd: [
    { name: "Ginger", amount: "10 drops", purpose: "Anti-inflammatory" },
    { name: "Chamomile", amount: "8 drops", purpose: "Soothes esophagus" },
    { name: "Lavender", amount: "6 drops", purpose: "Calming" }
  ],
  acid_reflux: [
    { name: "Ginger", amount: "10 drops", purpose: "Reduces reflux" },
    { name: "Chamomile", amount: "8 drops", purpose: "Soothing" },
    { name: "Fennel", amount: "6 drops", purpose: "Digestive support" }
  ],
  indigestion: [
    { name: "Ginger", amount: "10 drops", purpose: "Aids digestion" },
    { name: "Peppermint", amount: "8 drops", purpose: "Settles stomach" },
    { name: "Fennel", amount: "6 drops", purpose: "Reduces gas" }
  ],
  gas: [
    { name: "Peppermint", amount: "10 drops", purpose: "Carminative" },
    { name: "Fennel", amount: "8 drops", purpose: "Anti-gas" },
    { name: "Ginger", amount: "6 drops", purpose: "Digestive aid" }
  ],
  colitis: [
    { name: "Chamomile", amount: "10 drops", purpose: "Soothing" },
    { name: "Lavender", amount: "8 drops", purpose: "Anti-inflammatory" },
    { name: "Frankincense", amount: "6 drops", purpose: "Healing" }
  ],
  crohns: [
    { name: "Frankincense", amount: "10 drops", purpose: "Anti-inflammatory" },
    { name: "Chamomile", amount: "8 drops", purpose: "Soothing" },
    { name: "Lavender", amount: "6 drops", purpose: "Calming" }
  ],
  leaky_gut: [
    { name: "Frankincense", amount: "10 drops", purpose: "Gut lining support" },
    { name: "Ginger", amount: "8 drops", purpose: "Digestive aid" },
    { name: "Lavender", amount: "6 drops", purpose: "Anti-inflammatory" }
  ],
  sibo: [
    { name: "Peppermint", amount: "10 drops", purpose: "Antimicrobial" },
    { name: "Oregano", amount: "8 drops", purpose: "Antibacterial" },
    { name: "Ginger", amount: "6 drops", purpose: "Motility" }
  ],
  
  // === RESPIRATORY (12 conditions) ===
  congestion: [
    { name: "Eucalyptus", amount: "10 drops", purpose: "Opens airways" },
    { name: "Peppermint", amount: "8 drops", purpose: "Decongestant" },
    { name: "Tea Tree", amount: "6 drops", purpose: "Antimicrobial" }
  ],
  sinus: [
    { name: "Eucalyptus", amount: "10 drops", purpose: "Clears sinuses" },
    { name: "Peppermint", amount: "8 drops", purpose: "Opens passages" },
    { name: "Lavender", amount: "6 drops", purpose: "Anti-inflammatory" }
  ],
  cold: [
    { name: "Eucalyptus", amount: "8 drops", purpose: "Decongestant" },
    { name: "Tea Tree", amount: "8 drops", purpose: "Antiviral" },
    { name: "Lavender", amount: "6 drops", purpose: "Immune support" }
  ],
  flu: [
    { name: "Tea Tree", amount: "10 drops", purpose: "Antiviral" },
    { name: "Eucalyptus", amount: "8 drops", purpose: "Opens breathing" },
    { name: "Lavender", amount: "6 drops", purpose: "Rest support" }
  ],
  cough: [
    { name: "Eucalyptus", amount: "10 drops", purpose: "Suppresses cough" },
    { name: "Lavender", amount: "8 drops", purpose: "Soothes throat" },
    { name: "Frankincense", amount: "6 drops", purpose: "Deep breathing" }
  ],
  asthma: [
    { name: "Lavender", amount: "10 drops", purpose: "Calms breathing" },
    { name: "Frankincense", amount: "8 drops", purpose: "Deepens breath" },
    { name: "Eucalyptus", amount: "6 drops", purpose: "Opens airways (use cautiously)" }
  ],
  allergies: [
    { name: "Lavender", amount: "10 drops", purpose: "Anti-inflammatory" },
    { name: "Peppermint", amount: "8 drops", purpose: "Opens airways" },
    { name: "Lemon", amount: "6 drops", purpose: "Antihistamine support" }
  ],
  bronchitis: [
    { name: "Eucalyptus", amount: "10 drops", purpose: "Clears bronchi" },
    { name: "Frankincense", amount: "8 drops", purpose: "Deep breathing" },
    { name: "Lavender", amount: "6 drops", purpose: "Anti-inflammatory" }
  ],
  pneumonia: [
    { name: "Eucalyptus", amount: "10 drops", purpose: "Opens lungs" },
    { name: "Tea Tree", amount: "8 drops", purpose: "Antimicrobial" },
    { name: "Frankincense", amount: "6 drops", purpose: "Respiratory support" }
  ],
  pleurisy: [
    { name: "Frankincense", amount: "10 drops", purpose: "Deep breathing" },
    { name: "Lavender", amount: "8 drops", purpose: "Anti-inflammatory" },
    { name: "Eucalyptus", amount: "6 drops", purpose: "Opens airways" }
  ],
  laryngitis: [
    { name: "Lavender", amount: "10 drops", purpose: "Soothes throat" },
    { name: "Frankincense", amount: "8 drops", purpose: "Anti-inflammatory" },
    { name: "Peppermint", amount: "6 drops", purpose: "Cooling" }
  ],
  sore_throat: [
    { name: "Lavender", amount: "10 drops", purpose: "Soothes throat" },
    { name: "Peppermint", amount: "8 drops", purpose: "Cooling relief" },
    { name: "Tea Tree", amount: "6 drops", purpose: "Antimicrobial" }
  ],
  
  // === SKIN (20 conditions) ===
  acne: [
    { name: "Tea Tree", amount: "10 drops", purpose: "Antibacterial" },
    { name: "Lavender", amount: "8 drops", purpose: "Anti-inflammatory" },
    { name: "Frankincense", amount: "6 drops", purpose: "Scarring support" }
  ],
  eczema: [
    { name: "Lavender", amount: "10 drops", purpose: "Anti-inflammatory" },
    { name: "Frankincense", amount: "8 drops", purpose: "Skin repair" },
    { name: "Chamomile", amount: "6 drops", purpose: "Soothing" }
  ],
  psoriasis: [
    { name: "Frankincense", amount: "10 drops", purpose: "Cellular regeneration" },
    { name: "Myrrh", amount: "8 drops", purpose: "Skin healing" },
    { name: "Lavender", amount: "6 drops", purpose: "Anti-inflammatory" }
  ],
  rosacea: [
    { name: "Lavender", amount: "10 drops", purpose: "Calms redness" },
    { name: "Frankincense", amount: "8 drops", purpose: "Anti-inflammatory" },
    { name: "Chamomile", amount: "6 drops", purpose: "Soothing" }
  ],
  aging: [
    { name: "Frankincense", amount: "10 drops", purpose: "Cellular support" },
    { name: "Helichrysum", amount: "8 drops", purpose: "Tissue regeneration" },
    { name: "Myrrh", amount: "6 drops", purpose: "Anti-aging" }
  ],
  wrinkles: [
    { name: "Frankincense", amount: "10 drops", purpose: "Firms skin" },
    { name: "Helichrysum", amount: "8 drops", purpose: "Regenerative" },
    { name: "Rose", amount: "6 drops", purpose: "Hydrating" }
  ],
  scars: [
    { name: "Helichrysum", amount: "10 drops", purpose: "Scar reduction" },
    { name: "Frankincense", amount: "8 drops", purpose: "Cellular regeneration" },
    { name: "Lavender", amount: "6 drops", purpose: "Healing support" }
  ],
  burns: [
    { name: "Lavender", amount: "10 drops", purpose: "Pain relief, healing" },
    { name: "Helichrysum", amount: "8 drops", purpose: "Tissue repair" },
    { name: "Chamomile", amount: "6 drops", purpose: "Soothing" }
  ],
  wounds: [
    { name: "Helichrysum", amount: "10 drops", purpose: "Wound healing" },
    { name: "Lavender", amount: "8 drops", purpose: "Antimicrobial" },
    { name: "Frankincense", amount: "6 drops", purpose: "Cellular repair" }
  ],
  dermatitis: [
    { name: "Lavender", amount: "10 drops", purpose: "Anti-inflammatory" },
    { name: "Chamomile", amount: "8 drops", purpose: "Soothing" },
    { name: "Frankincense", amount: "6 drops", purpose: "Healing" }
  ],
  hives: [
    { name: "Lavender", amount: "10 drops", purpose: "Anti-inflammatory" },
    { name: "Peppermint", amount: "8 drops", purpose: "Cooling" },
    { name: "Chamomile", amount: "6 drops", purpose: "Soothing" }
  ],
  rash: [
    { name: "Lavender", amount: "10 drops", purpose: "Soothing" },
    { name: "Chamomile", amount: "8 drops", purpose: "Anti-inflammatory" },
    { name: "Frankincense", amount: "6 drops", purpose: "Healing" }
  ],
  itching: [
    { name: "Peppermint", amount: "10 drops", purpose: "Cooling relief" },
    { name: "Lavender", amount: "8 drops", purpose: "Anti-inflammatory" },
    { name: "Chamomile", amount: "6 drops", purpose: "Soothing" }
  ],
  dry_skin: [
    { name: "Lavender", amount: "10 drops", purpose: "Hydrating" },
    { name: "Frankincense", amount: "8 drops", purpose: "Cellular support" },
    { name: "Sandalwood", amount: "6 drops", purpose: "Moisturizing" }
  ],
  oily_skin: [
    { name: "Tea Tree", amount: "10 drops", purpose: "Balancing" },
    { name: "Lavender", amount: "8 drops", purpose: "Regulating" },
    { name: "Lemon", amount: "6 drops", purpose: "Clarifying" }
  ],
  sensitive_skin: [
    { name: "Lavender", amount: "10 drops", purpose: "Gentle calming" },
    { name: "Chamomile", amount: "8 drops", purpose: "Soothing" },
    { name: "Frankincense", amount: "6 drops", purpose: "Protective" }
  ],
  sunburn: [
    { name: "Lavender", amount: "10 drops", purpose: "Cooling relief" },
    { name: "Peppermint", amount: "8 drops", purpose: "Cooling" },
    { name: "Chamomile", amount: "6 drops", purpose: "Soothing" }
  ],
  cellulite: [
    { name: "Grapefruit", amount: "10 drops", purpose: "Lymphatic support" },
    { name: "Cypress", amount: "8 drops", purpose: "Circulation" },
    { name: "Juniper", amount: "6 drops", purpose: "Detoxifying" }
  ],
  varicose: [
    { name: "Cypress", amount: "10 drops", purpose: "Vein support" },
    { name: "Lavender", amount: "8 drops", purpose: "Anti-inflammatory" },
    { name: "Lemon", amount: "6 drops", purpose: "Circulation" }
  ],
  spider_veins: [
    { name: "Cypress", amount: "10 drops", purpose: "Vein tone" },
    { name: "Lavender", amount: "8 drops", purpose: "Anti-inflammatory" },
    { name: "Helichrysum", amount: "6 drops", purpose: "Tissue repair" }
  ],
  
  // === METABOLIC & CHRONIC (25 conditions) ===
  glucose: [
    { name: "Cinnamon", amount: "6 drops", purpose: "Supports healthy glucose metabolism" },
    { name: "Ginger", amount: "8 drops", purpose: "Improves circulation" },
    { name: "Lemon", amount: "6 drops", purpose: "Antioxidant support" }
  ],
  diabetes: [
    { name: "Cinnamon", amount: "6 drops", purpose: "Glucose support" },
    { name: "Ginger", amount: "8 drops", purpose: "Circulation" },
    { name: "Cypress", amount: "6 drops", purpose: "Lymphatic support" }
  ],
  metabolism: [
    { name: "Grapefruit", amount: "8 drops", purpose: "Supports healthy metabolism" },
    { name: "Peppermint", amount: "6 drops", purpose: "Energizing, reduces cravings" },
    { name: "Ginger", amount: "6 drops", purpose: "Thermogenic, aids digestion" }
  ],
  weight: [
    { name: "Grapefruit", amount: "8 drops", purpose: "Metabolism support" },
    { name: "Peppermint", amount: "6 drops", purpose: "Craving reduction" },
    { name: "Lemon", amount: "6 drops", purpose: "Detox support" }
  ],
  thyroid: [
    { name: "Frankincense", amount: "8 drops", purpose: "Glandular support" },
    { name: "Myrrh", amount: "8 drops", purpose: "Thyroid support" },
    { name: "Lavender", amount: "6 drops", purpose: "Stress reduction" }
  ],
  hypothyroid: [
    { name: "Myrrh", amount: "10 drops", purpose: "Thyroid stimulation" },
    { name: "Frankincense", amount: "8 drops", purpose: "Glandular support" },
    { name: "Ginger", amount: "6 drops", purpose: "Warming metabolism" }
  ],
  hyperthyroid: [
    { name: "Lavender", amount: "10 drops", purpose: "Calming" },
    { name: "Frankincense", amount: "8 drops", purpose: "Balancing" },
    { name: "Melissa", amount: "6 drops", purpose: "Thyroid modulation" }
  ],
  adrenal: [
    { name: "Lavender", amount: "10 drops", purpose: "Calms stress response" },
    { name: "Frankincense", amount: "8 drops", purpose: "Adrenal support" },
    { name: "Cedarwood", amount: "6 drops", purpose: "Grounding" }
  ],
  adrenal_fatigue: [
    { name: "Lavender", amount: "10 drops", purpose: "Restores calm" },
    { name: "Frankincense", amount: "8 drops", purpose: "Adrenal support" },
    { name: "Basil", amount: "6 drops", purpose: "Energy support" }
  ],
  cushings: [
    { name: "Lavender", amount: "10 drops", purpose: "Stress reduction" },
    { name: "Frankincense", amount: "8 drops", purpose: "Hormone support" },
    { name: "Geranium", amount: "6 drops", purpose: "Balance" }
  ],
  addisons: [
    { name: "Frankincense", amount: "10 drops", purpose: "Adrenal support" },
    { name: "Lavender", amount: "8 drops", purpose: "Stress reduction" },
    { name: "Ginger", amount: "6 drops", purpose: "Warming support" }
  ],
  lupus: [
    { name: "Lavender", amount: "10 drops", purpose: "Anti-inflammatory" },
    { name: "Frankincense", amount: "10 drops", purpose: "Modulates inflammation" },
    { name: "Helichrysum", amount: "8 drops", purpose: "Tissue trauma repair" }
  ],
  autoimmune: [
    { name: "Frankincense", amount: "10 drops", purpose: "Immune modulation" },
    { name: "Lavender", amount: "8 drops", purpose: "Anti-inflammatory" },
    { name: "Helichrysum", amount: "6 drops", purpose: "Tissue support" }
  ],
  cfs: [
    { name: "Lavender", amount: "10 drops", purpose: "Rest support" },
    { name: "Peppermint", amount: "8 drops", purpose: "Energy support" },
    { name: "Frankincense", amount: "6 drops", purpose: "Cellular support" }
  ],
  longcovid: [
    { name: "Frankincense", amount: "10 drops", purpose: "Lung support" },
    { name: "Lavender", amount: "8 drops", purpose: "Nervous system calm" },
    { name: "Eucalyptus", amount: "6 drops", purpose: "Respiratory support" }
  ],
  opioid: [
    { name: "Lavender", amount: "10 drops", purpose: "Calms withdrawal anxiety" },
    { name: "Frankincense", amount: "8 drops", purpose: "Supports emotional healing" },
    { name: "Bergamot FCF", amount: "6 drops", purpose: "Uplifts mood, reduces cravings" }
  ],
  addiction: [
    { name: "Lavender", amount: "10 drops", purpose: "Calms cravings" },
    { name: "Frankincense", amount: "8 drops", purpose: "Emotional healing" },
    { name: "Bergamot FCF", amount: "6 drops", purpose: "Mood support" }
  ],
  withdrawal: [
    { name: "Lavender", amount: "10 drops", purpose: "Calms withdrawal" },
    { name: "Frankincense", amount: "8 drops", purpose: "Emotional support" },
    { name: "Roman Chamomile", amount: "6 drops", purpose: "Soothing" }
  ],
  cravings: [
    { name: "Peppermint", amount: "10 drops", purpose: "Reduces cravings" },
    { name: "Grapefruit", amount: "8 drops", purpose: "Appetite control" },
    { name: "Lavender", amount: "6 drops", purpose: "Emotional balance" }
  ],
  detox: [
    { name: "Lemon", amount: "10 drops", purpose: "Liver support" },
    { name: "Grapefruit", amount: "8 drops", purpose: "Lymphatic" },
    { name: "Cypress", amount: "6 drops", purpose: "Detoxification" }
  ],
  candida: [
    { name: "Tea Tree", amount: "10 drops", purpose: "Antifungal" },
    { name: "Oregano", amount: "8 drops", purpose: "Antimicrobial" },
    { name: "Lavender", amount: "6 drops", purpose: "Soothing" }
  ],
  parasites: [
    { name: "Tea Tree", amount: "10 drops", purpose: "Antiparasitic" },
    { name: "Oregano", amount: "8 drops", purpose: "Antimicrobial" },
    { name: "Ginger", amount: "6 drops", purpose: "Digestive support" }
  ],
  lyme: [
    { name: "Frankincense", amount: "10 drops", purpose: "Immune support" },
    { name: "Lavender", amount: "8 drops", purpose: "Anti-inflammatory" },
    { name: "Tea Tree", amount: "6 drops", purpose: "Antimicrobial" }
  ],
  epstein: [
    { name: "Frankincense", amount: "10 drops", purpose: "Immune support" },
    { name: "Lavender", amount: "8 drops", purpose: "Anti-inflammatory" },
    { name: "Lemon", amount: "6 drops", purpose: "Antiviral" }
  ],
  shingles: [
    { name: "Lavender", amount: "10 drops", purpose: "Pain relief" },
    { name: "Peppermint", amount: "8 drops", purpose: "Cooling" },
    { name: "Frankincense", amount: "6 drops", purpose: "Healing" }
  ],
  
  // === NEUROLOGICAL (10 conditions) ===
  dementia: [
    { name: "Rosemary", amount: "10 drops", purpose: "Memory support" },
    { name: "Frankincense", amount: "8 drops", purpose: "Cognitive support" },
    { name: "Lemon", amount: "6 drops", purpose: "Mental clarity" }
  ],
  alzheimer: [
    { name: "Frankincense", amount: "10 drops", purpose: "Brain support" },
    { name: "Rosemary", amount: "8 drops", purpose: "Memory" },
    { name: "Lavender", amount: "6 drops", purpose: "Calming" }
  ],
  parkinson: [
    { name: "Frankincense", amount: "10 drops", purpose: "Nervous system" },
    { name: "Lavender", amount: "8 drops", purpose: "Muscle relaxation" },
    { name: "Vetiver", amount: "6 drops", purpose: "Grounding" }
  ],
  ms: [
    { name: "Frankincense", amount: "10 drops", purpose: "Nerve support" },
    { name: "Lavender", amount: "8 drops", purpose: "Anti-inflammatory" },
    { name: "Helichrysum", amount: "6 drops", purpose: "Nerve repair" }
  ],
  als: [
    { name: "Frankincense", amount: "10 drops", purpose: "Nervous system" },
    { name: "Lavender", amount: "8 drops", purpose: "Comfort" },
    { name: "Cedarwood", amount: "6 drops", purpose: "Grounding" }
  ],
  seizure: [
    { name: "Lavender", amount: "10 drops", purpose: "Calms nervous system" },
    { name: "Frankincense", amount: "8 drops", purpose: "Neurological support" },
    { name: "Ylang Ylang", amount: "6 drops", purpose: "Relaxation" }
  ],
  epilepsy: [
    { name: "Lavender", amount: "10 drops", purpose: "Calming" },
    { name: "Frankincense", amount: "8 drops", purpose: "Neurological" },
    { name: "Cedarwood", amount: "6 drops", purpose: "Grounding" }
  ],
  tremor: [
    { name: "Lavender", amount: "10 drops", purpose: "Calms tremors" },
    { name: "Frankincense", amount: "8 drops", purpose: "Nervous system" },
    { name: "Vetiver", amount: "6 drops", purpose: "Grounding" }
  ],
  stroke: [
    { name: "Frankincense", amount: "10 drops", purpose: "Brain support" },
    { name: "Lavender", amount: "8 drops", purpose: "Calming" },
    { name: "Rosemary", amount: "6 drops", purpose: "Circulation" }
  ],
  concussion: [
    { name: "Frankincense", amount: "10 drops", purpose: "Brain healing" },
    { name: "Lavender", amount: "8 drops", purpose: "Calming" },
    { name: "Helichrysum", amount: "6 drops", purpose: "Tissue repair" }
  ],
  
  // === MENTAL & COGNITIVE (10 conditions) ===
  adhd: [
    { name: "Rosemary", amount: "10 drops", purpose: "Focus support" },
    { name: "Peppermint", amount: "8 drops", purpose: "Mental clarity" },
    { name: "Vetiver", amount: "6 drops", purpose: "Grounding" }
  ],
  add: [
    { name: "Rosemary", amount: "10 drops", purpose: "Focus" },
    { name: "Peppermint", amount: "8 drops", purpose: "Alertness" },
    { name: "Lemon", amount: "6 drops", purpose: "Clarity" }
  ],
  focus: [
    { name: "Rosemary", amount: "10 drops", purpose: "Mental clarity" },
    { name: "Peppermint", amount: "8 drops", purpose: "Alertness" },
    { name: "Lemon", amount: "6 drops", purpose: "Focus support" }
  ],
  memory: [
    { name: "Rosemary", amount: "10 drops", purpose: "Memory enhancement" },
    { name: "Frankincense", amount: "8 drops", purpose: "Cognitive support" },
    { name: "Lemon", amount: "6 drops", purpose: "Mental clarity" }
  ],
  brain_fog: [
    { name: "Rosemary", amount: "10 drops", purpose: "Clears fog" },
    { name: "Peppermint", amount: "8 drops", purpose: "Mental clarity" },
    { name: "Lemon", amount: "6 drops", purpose: "Alertness" }
  ],
  concentration: [
    { name: "Rosemary", amount: "10 drops", purpose: "Concentration" },
    { name: "Peppermint", amount: "8 drops", purpose: "Focus" },
    { name: "Basil", amount: "6 drops", purpose: "Mental energy" }
  ],
  learning: [
    { name: "Rosemary", amount: "10 drops", purpose: "Memory" },
    { name: "Lemon", amount: "8 drops", purpose: "Clarity" },
    { name: "Frankincense", amount: "6 drops", purpose: "Cognitive" }
  ],
  autism: [
    { name: "Lavender", amount: "10 drops", purpose: "Calming" },
    { name: "Frankincense", amount: "8 drops", purpose: "Grounding" },
    { name: "Vetiver", amount: "6 drops", purpose: "Stabilizing" }
  ],
  aspergers: [
    { name: "Lavender", amount: "10 drops", purpose: "Calming" },
    { name: "Cedarwood", amount: "8 drops", purpose: "Grounding" },
    { name: "Frankincense", amount: "6 drops", purpose: "Focus" }
  ],
  sensory: [
    { name: "Lavender", amount: "10 drops", purpose: "Sensory calm" },
    { name: "Cedarwood", amount: "8 drops", purpose: "Grounding" },
    { name: "Vetiver", amount: "6 drops", purpose: "Stabilizing" }
  ],
  
  // === CARDIOVASCULAR (8 conditions) ===
  hypertension: [
    { name: "Lavender", amount: "10 drops", purpose: "Lowers blood pressure" },
    { name: "Ylang Ylang", amount: "8 drops", purpose: "Calms heart" },
    { name: "Marjoram", amount: "6 drops", purpose: "Circulation" }
  ],
  hypotension: [
    { name: "Rosemary", amount: "10 drops", purpose: "Raises blood pressure" },
    { name: "Peppermint", amount: "8 drops", purpose: "Circulation" },
    { name: "Ginger", amount: "6 drops", purpose: "Warming" }
  ],
  palpitations: [
    { name: "Lavender", amount: "10 drops", purpose: "Calms heart" },
    { name: "Ylang Ylang", amount: "8 drops", purpose: "Regulates rhythm" },
    { name: "Frankincense", amount: "6 drops", purpose: "Deep breathing" }
  ],
  arrhythmia: [
    { name: "Lavender", amount: "10 drops", purpose: "Heart rhythm" },
    { name: "Ylang Ylang", amount: "8 drops", purpose: "Calming" },
    { name: "Frankincense", amount: "6 drops", purpose: "Stabilizing" }
  ],
  angina: [
    { name: "Lavender", amount: "10 drops", purpose: "Calms chest" },
    { name: "Frankincense", amount: "8 drops", purpose: "Deep breathing" },
    { name: "Ylang Ylang", amount: "6 drops", purpose: "Heart support" }
  ],
  chf: [
    { name: "Lavender", amount: "10 drops", purpose: "Calming" },
    { name: "Frankincense", amount: "8 drops", purpose: "Heart support" },
    { name: "Hawthorn", amount: "6 drops", purpose: "Cardiovascular" }
  ],
  circulation: [
    { name: "Ginger", amount: "10 drops", purpose: "Improves circulation" },
    { name: "Black Pepper", amount: "8 drops", purpose: "Warming" },
    { name: "Rosemary", amount: "6 drops", purpose: "Blood flow" }
  ],
  varicose_veins: [
    { name: "Cypress", amount: "10 drops", purpose: "Vein support" },
    { name: "Lavender", amount: "8 drops", purpose: "Anti-inflammatory" },
    { name: "Lemon", amount: "6 drops", purpose: "Circulation" }
  ],
  
  // === SPECIALTY & ENERGETIC (15 conditions) ===
  'blood-type-a': [
    { name: "Lavender", amount: "10 drops", purpose: "Calms sensitive digestion" },
    { name: "Chamomile", amount: "8 drops", purpose: "Soothes stress response" },
    { name: "Ylang Ylang", amount: "6 drops", purpose: "Balances emotions" }
  ],
  'blood-type-b': [
    { name: "Ginger", amount: "10 drops", purpose: "Digestive support" },
    { name: "Peppermint", amount: "8 drops", purpose: "Mental clarity" },
    { name: "Lavender", amount: "6 drops", purpose: "Balance" }
  ],
  'blood-type-o': [
    { name: "Ginger", amount: "10 drops", purpose: "Metabolism support" },
    { name: "Peppermint", amount: "8 drops", purpose: "Energy" },
    { name: "Orange", amount: "6 drops", purpose: "Uplifting" }
  ],
  'blood-type-ab': [
    { name: "Lavender", amount: "10 drops", purpose: "Calming" },
    { name: "Frankincense", amount: "8 drops", purpose: "Balance" },
    { name: "Bergamot FCF", amount: "6 drops", purpose: "Mood" }
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
  meditation: [
    { name: "Frankincense", amount: "10 drops", purpose: "Deepens meditation" },
    { name: "Sandalwood", amount: "8 drops", purpose: "Grounding, spiritual" },
    { name: "Lavender", amount: "6 drops", purpose: "Calms mind" }
  ],
  grounding: [
    { name: "Cedarwood", amount: "10 drops", purpose: "Deeply grounding" },
    { name: "Vetiver", amount: "8 drops", purpose: "Stabilizing" },
    { name: "Frankincense", amount: "6 drops", purpose: "Centering" }
  ],
  energy: [
    { name: "Peppermint", amount: "10 drops", purpose: "Energizing" },
    { name: "Rosemary", amount: "8 drops", purpose: "Mental energy" },
    { name: "Grapefruit", amount: "6 drops", purpose: "Uplifting" }
  ],
  chakra: [
    { name: "Frankincense", amount: "10 drops", purpose: "Crown chakra" },
    { name: "Lavender", amount: "8 drops", purpose: "Third eye" },
    { name: "Cedarwood", amount: "6 drops", purpose: "Root chakra" }
  ],
  aura: [
    { name: "Frankincense", amount: "10 drops", purpose: "Aura cleansing" },
    { name: "Lavender", amount: "8 drops", purpose: "Protection" },
    { name: "Sage", amount: "6 drops", purpose: "Purification" }
  ],
  protection: [
    { name: "Frankincense", amount: "10 drops", purpose: "Spiritual protection" },
    { name: "Lavender", amount: "8 drops", purpose: "Calming" },
    { name: "Cedarwood", amount: "6 drops", purpose: "Grounding" }
  ],
  xe: [
    { name: "Lavender", amount: "10 drops", purpose: "Calms nerves, reduces inflammation" },
    { name: "Roman Chamomile", amount: "8 drops", purpose: "Soothes tissue" },
    { name: "Bergamot FCF", amount: "6 drops", purpose: "Uplifts mood" }
  ]
};

// ✅✅✅ EXTENSIVE ALIAS MAPPING - 500+ NATURAL LANGUAGE VARIATIONS
const CONDITION_ALIASES = {
  // === PAIN ALIASES ===
  'headache': ['head ache', 'head pain', 'migraine', 'tension head', 'sinus head', 'pressure head', 'throbbing head', 'pounding head', 'cluster head', 'vascular head'],
  'migraine': ['migraines', 'migraine headache', 'hemiplegic', 'aura migraine', 'ocular migraine', 'menstrual migraine', 'hormone migraine'],
  'tension': ['tension headache', 'tension head', 'stress head', 'tight head', 'band head', 'pressure head', 'tightness'],
  'musclepain': ['muscle pain', 'muscle ache', 'muscle aches', 'sore muscle', 'sore muscles', 'muscle soreness', 'myalgia', 'muscular pain'],
  'soreness': ['sore', 'soreness', 'post workout', 'post exercise', 'doms', 'delayed onset', 'workout sore', 'gym sore'],
  'joint': ['joint pain', 'joint ache', 'aching joints', 'joint discomfort', 'joint stiffness', 'joint swelling'],
  'arthritis': ['arthritic', 'arthrosis', 'osteoarthritis', 'rheumatoid arthritis', 'ra', 'oa', 'degenerative joint', 'wear and tear'],
  'sciatica': ['sciatic', 'sciatic nerve', 'sciatic pain', 'piriformis', 'lower back leg', 'shooting leg', 'radiating leg'],
  'nervepain': ['nerve pain', 'nerve ache', 'neuralgia', 'nerve damage', 'pinched nerve', 'compressed nerve'],
  'neuropathy': ['peripheral neuropathy', 'diabetic neuropathy', 'nerve damage', 'numbness', 'tingling', 'pins and needles'],
  'backpain': ['back pain', 'back ache', 'lower back', 'low back', 'lumbar', 'upper back', 'mid back', 'thoracic', 'spine pain'],
  'neckpain': ['neck pain', 'neck ache', 'stiff neck', 'cervical', 'whiplash', 'text neck', 'forward head'],
  'shoulder': ['shoulder pain', 'shoulder ache', 'rotator cuff', 'frozen shoulder', 'impingement', 'shoulder blade', 'scapula'],
  'knee': ['knee pain', 'knee ache', 'patella', 'kneecap', 'runner knee', 'jumpers knee', 'arthritis knee'],
  'injury': ['injury', 'injuries', 'trauma', 'accident', 'hurt', 'wound', 'bruise', 'contusion'],
  'sprain': ['sprain', 'sprained', 'twisted', 'rolled ankle', 'ligament'],
  'strain': ['strain', 'strained', 'pulled muscle', 'torn muscle', 'muscle tear'],
  'tendonitis': ['tendonitis', 'tendinitis', 'tennis elbow', 'golfers elbow', 'achilles', 'rotator cuff tendonitis'],
  'bursitis': ['bursitis', 'bursa', 'hip bursitis', 'shoulder bursitis', 'knee bursitis'],
  'plantar': ['plantar fasciitis', 'heel pain', 'foot pain', 'arch pain', 'heel spur'],
  'carpal': ['carpal tunnel', 'wrist pain', 'repetitive strain', 'rsi', 'mouse hand', 'keyboard hand'],
  'fibromyalgia': ['fibro', 'fms', 'fibromyalgia', 'widespread pain', 'all over pain', 'chronic pain syndrome'],
  'chronic_pain': ['chronic pain', 'persistent pain', 'long term pain', 'ongoing pain', 'constant pain'],
  'inflammation': ['inflammation', 'inflamed', 'swelling', 'edema', 'puffy', 'redness', 'heat'],
  'swelling': ['swelling', 'swollen', 'fluid retention', 'water retention', 'edema', 'puffy'],
  
  // === STRESS ALIASES ===
  'stress': ['stress', 'stressed', 'stressful', 'overwhelm', 'overwhelmed', 'pressure', 'tension', 'strain'],
  'anxiety': ['anxiety', 'anxious', 'anxiousness', 'nervous', 'nervousness', 'worry', 'worried', 'panic', 'panic attack'],
  'panic': ['panic', 'panic attack', 'panic disorder', 'hyperventilation', 'acute anxiety'],
  'depression': ['depression', 'depressed', 'depressive', 'sad', 'sadness', 'low mood', 'down', 'blue', 'melancholy'],
  'mood': ['mood', 'moods', 'mood swing', 'mood swings', 'emotional', 'emotion', 'feelings'],
  'anger': ['anger', 'angry', 'rage', 'furious', 'mad', 'irritated', 'irritation', 'frustrated', 'frustration'],
  'grief': ['grief', 'grieving', 'loss', 'bereavement', 'mourning', 'sadness', 'heartbreak'],
  'trauma': ['trauma', 'traumatic', 'ptsd', 'post traumatic', 'abuse', 'violence', 'accident trauma'],
  'overwhelm': ['overwhelm', 'overwhelmed', 'too much', 'cant cope', 'cant handle', 'burnout', 'burnt out'],
  'burnout': ['burnout', 'burnt out', 'exhausted', 'depleted', 'drained', 'compassion fatigue'],
  'fatigue': ['fatigue', 'tired', 'tiredness', 'exhaustion', 'exhausted', 'lethargy', 'lethargic', 'weakness'],
  'exhaustion': ['exhaustion', 'exhausted', 'extreme fatigue', 'chronic fatigue', 'adrenal fatigue'],
  'irritability': ['irritability', 'irritable', 'snappy', 'short tempered', 'easily annoyed', 'grumpy'],
  'frustration': ['frustration', 'frustrated', 'annoyed', 'agitated', 'restless'],
  'loneliness': ['loneliness', 'lonely', 'isolated', 'isolation', 'alone', 'disconnected'],
  'sadness': ['sadness', 'sad', 'unhappy', 'down', 'low', 'blue', 'tearful'],
  'fear': ['fear', 'afraid', 'scared', 'frightened', 'terrified', 'phobia', 'phobic'],
  'worry': ['worry', 'worried', 'worries', 'concern', 'concerned', 'apprehensive'],
  'shock': ['shock', 'shocked', 'trauma', 'acute stress', 'surprise trauma'],
  'emotional': ['emotional', 'emotions', 'feelings', 'mood', 'sensitive', 'oversensitive'],
  
  // === SLEEP ALIASES ===
  'insomnia': ['insomnia', 'insomniac', 'sleepless', 'sleeplessness', 'cant sleep', 'cannot sleep', 'trouble sleeping'],
  'sleep': ['sleep', 'sleeping', 'sleep issue', 'sleep problem', 'sleep disorder', 'poor sleep', 'bad sleep'],
  'restless': ['restless', 'restlessness', 'tossing', 'turning', 'toss and turn', 'cant settle'],
  'nightmares': ['nightmares', 'bad dreams', 'scary dreams', 'night terrors', 'disturbing dreams'],
  'sleeplessness': ['sleeplessness', 'wakeful', 'wakefulness', 'awake at night'],
  'jetlag': ['jet lag', 'jetlag', 'time zone', 'travel fatigue', 'circadian disruption'],
  'shiftwork': ['shift work', 'shiftwork', 'night shift', 'rotating shift', 'irregular hours'],
  'apnea': ['sleep apnea', 'apnea', 'breathing sleep', 'stop breathing sleep'],
  'snoring': ['snoring', 'snore', 'loud snoring', 'partner snoring'],
  'dreams': ['dreams', 'dreaming', 'vivid dreams', 'lucid dreams', 'dream work'],
  
  // === HORMONAL ALIASES ===
  'menopause': ['menopause', 'menopausal', 'peri-menopause', 'perimenopause', 'post-menopause', 'change of life', 'climacteric'],
  'hotflash': ['hot flash', 'hot flashes', 'hotflush', 'hot flushes', 'night sweat', 'night sweats'],
  'pms': ['pms', 'premenstrual', 'pre menstrual', 'period symptoms', 'monthly symptoms'],
  'cramps': ['cramps', 'cramping', 'menstrual cramps', 'period cramps', 'abdominal cramps', 'spasms'],
  'period': ['period', 'menstruation', 'menses', 'monthly', 'menstrual', 'cycle'],
  'endometriosis': ['endometriosis', 'endo', 'endometrial', 'uterine lining'],
  'pcos': ['pcos', 'polycystic ovary', 'polycystic ovarian syndrome', 'ovarian cysts'],
  'fertility': ['fertility', 'fertilization', 'conception', 'trying to conceive', 'ttc', 'infertility'],
  'pregnancy': ['pregnancy', 'pregnant', 'expecting', 'prenatal', 'maternity', 'gestation'],
  'postpartum': ['postpartum', 'post-partum', 'postnatal', 'after birth', 'new mom', 'fourth trimester'],
  'libido': ['libido', 'sex drive', 'low libido', 'sexual desire', 'intimacy', 'arousal'],
  'impotence': ['impotence', 'erectile dysfunction', 'ed', 'performance anxiety', 'male enhancement'],
  'infertility': ['infertility', 'infertile', 'cant conceive', 'cannot conceive', 'fertility issues'],
  'miscarriage': ['miscarriage', 'pregnancy loss', 'loss of pregnancy', 'stillbirth'],
  'abortion': ['abortion', 'termination', 'pregnancy termination'],
  'breastfeeding': ['breastfeeding', 'breast feeding', 'nursing', 'lactation', 'chestfeeding'],
  'lactation': ['lactation', 'milk supply', 'low milk', 'breast milk', 'nursing'],
  'mastitis': ['mastitis', 'breast infection', 'clogged duct', 'plugged duct'],
  'prostate': ['prostate', 'prostate health', 'bph', 'enlarged prostate', 'prostate issues'],
  'ed': ['ed', 'erectile dysfunction', 'impotence', 'performance'],
  
  // === DIGESTIVE ALIASES ===
  'digestion': ['digestion', 'digestive', 'digestive issue', 'digestive problem', 'gut', 'gut health', 'stomach'],
  'bloating': ['bloating', 'bloat', 'bloated', 'distended', 'swollen belly', 'puffy belly'],
  'nausea': ['nausea', 'nauseous', 'queasy', 'sick', 'upset stomach', 'morning sickness'],
  'ibs': ['ibs', 'irritable bowel', 'irritable bowel syndrome', 'spastic colon'],
  'constipation': ['constipation', 'constipated', 'irregular', 'infrequent', 'hard stool', 'backed up'],
  'diarrhea': ['diarrhea', 'loose stool', 'frequent bm', 'urgent', 'running'],
  'heartburn': ['heartburn', 'acid reflux', 'gerd', 'reflux', 'indigestion'],
  'gerd': ['gerd', 'gastroesophageal reflux', 'acid reflux', 'reflux disease'],
  'acid_reflux': ['acid reflux', 'reflux', 'heartburn', 'gerd', 'stomach acid'],
  'indigestion': ['indigestion', 'dyspepsia', 'upset stomach', 'discomfort', 'heavy stomach'],
  'gas': ['gas', 'gassy', 'flatulence', 'farting', 'burping', 'belching', 'bloating'],
  'colitis': ['colitis', 'ulcerative colitis', 'uc', 'inflammatory bowel'],
  'crohns': ['crohns', 'crohns disease', 'ibd', 'inflammatory bowel disease'],
  'leaky_gut': ['leaky gut', 'intestinal permeability', 'gut permeability'],
  'sibo': ['sibo', 'small intestine bacterial overgrowth', 'bacterial overgrowth'],
  
  // === RESPIRATORY ALIASES ===
  'congestion': ['congestion', 'congested', 'stuffy', 'stuffy nose', 'blocked nose', 'nasal congestion'],
  'sinus': ['sinus', 'sinuses', 'sinusitis', 'sinus infection', 'sinus pressure', 'sinus pain'],
  'cold': ['cold', 'common cold', 'upper respiratory', 'sniffles', 'runny nose'],
  'flu': ['flu', 'influenza', 'stomach flu', 'viral infection', 'fever'],
  'cough': ['cough', 'coughing', 'chronic cough', 'dry cough', 'wet cough', 'productive cough'],
  'asthma': ['asthma', 'asthmatic', 'wheezing', 'breathless', 'shortness of breath'],
  'allergies': ['allergies', 'allergic', 'hay fever', 'seasonal allergies', 'pollen', 'dust allergies'],
  'bronchitis': ['bronchitis', 'bronchial', 'chest cold', 'bronchial infection'],
  'pneumonia': ['pneumonia', 'lung infection', 'pneumonitis'],
  'pleurisy': ['pleurisy', 'pleuritis', 'lung inflammation'],
  'laryngitis': ['laryngitis', 'lost voice', 'hoarse', 'hoarseness', 'vocal cord'],
  'sore_throat': ['sore throat', 'throat pain', 'scratchy throat', 'pharyngitis', 'strep throat'],
  
  // === SKIN ALIASES ===
  'acne': ['acne', 'pimples', 'breakouts', 'zits', 'blemishes', 'blackheads', 'whiteheads'],
  'eczema': ['eczema', 'atopic dermatitis', 'dry patches', 'itchy skin', 'skin rash'],
  'psoriasis': ['psoriasis', 'psoriatic', 'scaly skin', 'plaque', 'skin flakes'],
  'rosacea': ['rosacea', 'red face', 'facial redness', 'flushed', 'spider veins face'],
  'aging': ['aging', 'ageing', 'anti-aging', 'old skin', 'mature skin', 'wrinkles'],
  'wrinkles': ['wrinkles', 'lines', 'fine lines', 'crow feet', 'forehead lines', 'expression lines'],
  'scars': ['scars', 'scarring', 'scar tissue', 'keloid', 'stretch marks', 'striae'],
  'burns': ['burns', 'burned', 'sunburn', 'thermal burn', 'chemical burn'],
  'wounds': ['wounds', 'cuts', 'lacerations', 'open wounds', 'sores'],
  'dermatitis': ['dermatitis', 'contact dermatitis', 'skin inflammation', 'skin irritation'],
  'hives': ['hives', 'urticaria', 'welts', 'bumps', 'allergic reaction skin'],
  'rash': ['rash', 'skin rash', 'red rash', 'itchy rash', 'breakout'],
  'itching': ['itching', 'itchy', 'pruritus', 'scratchy', 'itch'],
  'dry_skin': ['dry skin', 'xerosis', 'flaky skin', 'rough skin', 'dehydrated skin'],
  'oily_skin': ['oily skin', 'greasy skin', 'shiny skin', 'excess oil'],
  'sensitive_skin': ['sensitive skin', 'reactive skin', 'easily irritated', 'delicate skin'],
  'sunburn': ['sunburn', 'sun burned', 'sun damage', 'uv damage', 'overexposed'],
  'cellulite': ['cellulite', 'orange peel', 'dimpled skin', 'cottage cheese skin'],
  'varicose': ['varicose', 'varicose veins', 'spider veins', 'bulging veins'],
  'spider_veins': ['spider veins', 'telangiectasia', 'broken capillaries', 'thread veins'],
  
  // === METABOLIC ALIASES ===
  'glucose': ['glucose', 'blood sugar', 'sugar level', 'glucose level', 'hyperglycemia', 'high blood sugar'],
  'diabetes': ['diabetes', 'diabetic', 'type 1 diabetes', 'type 2 diabetes', 't1d', 't2d', 'juvenile diabetes'],
  'metabolism': ['metabolism', 'metabolic', 'slow metabolism', 'fast metabolism', 'metabolic rate', 'bmr'],
  'weight': ['weight', 'weight loss', 'weight gain', 'obesity', 'overweight', 'underweight', 'body weight'],
  'thyroid': ['thyroid', 'thyroid issues', 'thyroid problems', 'thyroid disorder', 'thyroid disease'],
  'hypothyroid': ['hypothyroid', 'underactive thyroid', 'low thyroid', 'hashimotos', 'hashimoto'],
  'hyperthyroid': ['hyperthyroid', 'overactive thyroid', 'high thyroid', 'graves disease', 'graves'],
  'adrenal': ['adrenal', 'adrenal issues', 'adrenal problems', 'adrenal disorder', 'hpa axis'],
  'adrenal_fatigue': ['adrenal fatigue', 'adrenal exhaustion', 'burnt adrenals', 'hpa dysfunction'],
  'cushings': ['cushings', 'cushings syndrome', 'high cortisol', 'cortisol excess'],
  'addisons': ['addisons', 'addisons disease', 'low cortisol', 'adrenal insufficiency'],
  'lupus': ['lupus', 'sle', 'systemic lupus', 'lupus erythematosus', 'autoimmune lupus'],
  'autoimmune': ['autoimmune', 'autoimmune disease', 'autoimmune disorder', 'immune system attack'],
  'cfs': ['cfs', 'chronic fatigue syndrome', 'mecfs', 'myalgic encephalomyelitis', 'post viral'],
  'longcovid': ['long covid', 'long-covid', 'post covid', 'long hauler', 'covid long term'],
  'opioid': ['opioid', 'opioids', 'opiate', 'opiates', 'narcotic', 'painkiller dependency'],
  'addiction': ['addiction', 'addicted', 'substance abuse', 'substance use', 'dependency'],
  'withdrawal': ['withdrawal', 'detox', 'detoxing', 'coming off', 'quitting'],
  'cravings': ['cravings', 'urge', 'desire', 'want', 'compulsion'],
  'detox': ['detox', 'detoxification', 'cleanse', 'purify', 'eliminate toxins'],
  'candida': ['candida', 'yeast', 'yeast infection', 'thrush', 'fungal overgrowth'],
  'parasites': ['parasites', 'worms', 'intestinal parasites', 'parasitic infection'],
  'lyme': ['lyme', 'lyme disease', 'tick bite', 'borrelia'],
  'epstein': ['epstein', 'epstein barr', 'ebv', 'mono', 'mononucleosis'],
  'shingles': ['shingles', 'herpes zoster', 'zoster', 'post herpetic neuralgia'],
  
  // === NEUROLOGICAL ALIASES ===
  'dementia': ['dementia', 'cognitive decline', 'memory loss', 'confusion', 'senility'],
  'alzheimer': ['alzheimer', 'alzheimers', 'alzheimers disease', 'ad', 'memory disease'],
  'parkinson': ['parkinson', 'parkinsons', 'parkinsons disease', 'pd', 'tremor disease'],
  'ms': ['ms', 'multiple sclerosis', 'demyelinating', 'neurological autoimmune'],
  'als': ['als', 'amyotrophic lateral sclerosis', 'lou gehrigs', 'motor neuron disease'],
  'seizure': ['seizure', 'seizures', 'convulsion', 'epileptic episode'],
  'epilepsy': ['epilepsy', 'epileptic', 'seizure disorder', 'convulsive disorder'],
  'tremor': ['tremor', 'tremors', 'shaking', 'shaky', 'essential tremor'],
  'stroke': ['stroke', 'cerebrovascular accident', 'cva', 'brain attack', 'mini stroke'],
  'concussion': ['concussion', 'head injury', 'traumatic brain injury', 'tbi', 'brain trauma'],
  
  // === MENTAL ALIASES ===
  'adhd': ['adhd', 'attention deficit', 'attention deficit hyperactivity', 'hyperactive', 'impulsive'],
  'add': ['add', 'attention deficit', 'attention disorder', 'inattentive', 'distractible'],
  'focus': ['focus', 'concentration', 'attention', 'mental focus', 'clarity'],
  'memory': ['memory', 'memory loss', 'forgetful', 'forgetfulness', 'recall', 'remembering'],
  'brain_fog': ['brain fog', 'mental fog', 'foggy', 'cloudy mind', 'fuzzy thinking', 'mental clarity'],
  'concentration': ['concentration', 'focus', 'attention', 'mental focus', 'study'],
  'learning': ['learning', 'learning disability', 'dyslexia', 'study', 'education'],
  'autism': ['autism', 'autistic', 'asd', 'autism spectrum', 'neurodivergent'],
  'aspergers': ['aspergers', 'asperger syndrome', 'high functioning autism', 'level 1 autism'],
  'sensory': ['sensory', 'sensory processing', 'sensory overload', 'sensory issues', 'spd'],
  
  // === CARDIOVASCULAR ALIASES ===
  'hypertension': ['hypertension', 'high blood pressure', 'hbp', 'elevated bp', 'pressure high'],
  'hypotension': ['hypotension', 'low blood pressure', 'low bp', 'pressure low', 'orthostatic'],
  'palpitations': ['palpitations', 'heart palpitations', 'racing heart', 'fluttering', 'skipped beats'],
  'arrhythmia': ['arrhythmia', 'irregular heartbeat', 'heart rhythm', 'afib', 'atrial fibrillation'],
  'angina': ['angina', 'chest pain', 'heart pain', 'cardiac pain', 'ischemia'],
  'chf': ['chf', 'congestive heart failure', 'heart failure', 'cardiac insufficiency'],
  'circulation': ['circulation', 'poor circulation', 'blood flow', 'peripheral circulation', 'cold hands'],
  'varicose_veins': ['varicose veins', 'varicose', 'vein issues', 'venous insufficiency', 'leg veins'],
  
  // === SPECIALTY ALIASES ===
  'blood-type-a': ['blood type a', 'type a', 'a positive', 'a negative', 'blood type diet'],
  'blood-type-b': ['blood type b', 'type b', 'b positive', 'b negative'],
  'blood-type-o': ['blood type o', 'type o', 'o positive', 'o negative', 'blood type o diet'],
  'blood-type-ab': ['blood type ab', 'type ab', 'ab positive', 'ab negative'],
  'telomere': ['telomere', 'telomeres', 'anti-aging', 'longevity', 'cellular aging', 'life extension'],
  'unbroken': ['unbroken', 'chronic illness', 'invisible illness', 'spoonie', 'warrior', 'fighter'],
  'queen': ['queen', 'queen energy', 'goddess', 'divine feminine', 'self-love', 'empowerment'],
  'king': ['king', 'king energy', 'divine masculine', 'leadership', 'strength', 'power'],
  'meditation': ['meditation', 'meditating', 'mindfulness', 'zen', 'contemplation', 'spiritual'],
  'grounding': ['grounding', 'grounded', 'earthing', 'stability', 'centered', 'rooted'],
  'energy': ['energy', 'energy boost', 'vitality', 'vigor', 'life force', 'chi', 'prana'],
  'chakra': ['chakra', 'chakras', 'energy centers', 'spiritual energy', 'kundalini'],
  'aura': ['aura', 'auric field', 'energy field', 'biofield', 'spiritual protection'],
  'protection': ['protection', 'spiritual protection', 'psychic protection', 'energy shield', 'warding'],
  'xe': ['xe', 'everybodys oil', 'universal blend', 'starter blend', 'basic blend']
};

// ✅ CONDITION RELATIONSHIP MAPPING - FOR MULTI-CONDITION INPUTS
const CONDITION_RELATIONSHIPS = {
  // If user has multiple related conditions, recommend the most comprehensive blend
  'stress + insomnia': 'insomnia', // Stress-related insomnia → sleep blend
  'anxiety + panic': 'panic', // Acute takes priority
  'depression + fatigue': 'depression', // Root cause
  'pain + inflammation': 'inflammation', // Systemic approach
  'headache + tension': 'tension', // Root cause
  'migraine + nausea': 'migraine', // Primary condition
  'pms + cramps': 'cramps', // Most symptomatic
  'menopause + hotflash': 'hotflash', // Most bothersome
  'digestion + bloating': 'bloating', # Most specific
  'ibs + constipation': 'ibs', // Primary diagnosis
  'cold + congestion': 'congestion', // Most symptomatic
  'flu + fever': 'flu', // Primary illness
  'acne + scarring': 'acne', # Active issue first
  'aging + wrinkles': 'wrinkles', // Most specific
  'diabetes + neuropathy': 'neuropathy', // Complication focus
  'thyroid + fatigue': 'thyroid', // Root cause
  'autoimmune + inflammation': 'autoimmune', // Primary diagnosis
  'adrenal + stress': 'adrenal', # Root cause
  'ptsd + anxiety': 'trauma', // Root cause
  'addiction + cravings': 'addiction', // Primary issue
  'pregnancy + nausea': 'pregnancy', // Primary state
  'postpartum + depression': 'postpartum', // Primary state
  'cancer + pain': 'chronic_pain', // Symptom management
  'chemo + nausea': 'nausea', // Most bothersome symptom
  'surgery + pain': 'injury', # Recovery focus
  'stroke + paralysis': 'stroke', // Primary diagnosis
  'heart + anxiety': 'palpitations', # Most symptomatic
  'lung + breathing': 'asthma', // Most specific
  'kidney + swelling': 'swelling', // Symptom management
  'liver + detox': 'detox', // Support focus
  'gut + bloating': 'bloating', // Most symptomatic
  'skin + itching': 'itching', // Most bothersome
  'joint + arthritis': 'arthritis', // Primary diagnosis
  'back + sciatica': 'sciatica', // Most specific
  'neck + headache': 'headache', // Most symptomatic
  'shoulder + frozen': 'shoulder', // Primary issue
  'knee + arthritis': 'arthritis', // Primary diagnosis
  'foot + plantar': 'plantar', // Most specific
  'hand + carpal': 'carpal', // Most specific
  'eye + strain': 'headache', // Related symptom
  'ear + infection': 'cold', // Related illness
  'nose + sinus': 'sinus', // Most specific
  'throat + sore': 'sore_throat', // Most specific
  'mouth + ulcer': 'stress', // Often stress-related
  'teeth + pain': 'headache', // Related pain
  'gum + inflammation': 'inflammation', // Systemic approach
  'hair + loss': 'thyroid', // Often thyroid-related
  'nail + brittle': 'thyroid', // Often thyroid-related
  'bone + density': 'thyroid', # Metabolic support
  'muscle + weakness': 'fatigue', // Systemic approach
  'nerve + damage': 'neuropathy', // Primary diagnosis
  'blood + sugar': 'glucose', // Primary issue
  'cholesterol + high': 'metabolism', // Metabolic support
  'weight + gain': 'metabolism', // Root cause
  'weight + loss': 'metabolism', // Root cause
  'appetite + increase': 'cravings', // Most specific
  'appetite + decrease': 'nausea', // Often related
  'sleep + apnea': 'apnea', // Primary diagnosis
  'snore + loud': 'snoring', // Primary issue
  'dream + vivid': 'dreams', // Primary issue
  'nightmare + frequent': 'nightmares', // Primary issue
  'mood + swing': 'mood', // Primary issue
  'anger + rage': 'anger', // Primary issue
  'grief + loss': 'grief', // Primary issue
  'trauma + abuse': 'trauma', // Primary issue
  'fear + phobia': 'fear', // Primary issue
  'worry + anxiety': 'anxiety', // Primary issue
  'stress + burnout': 'burnout', // More severe
  'fatigue + exhaustion': 'exhaustion', // More severe
  'pain + chronic': 'chronic_pain', // Primary diagnosis
  'inflammation + systemic': 'inflammation', // Primary issue
  'infection + viral': 'flu', // Primary type
  'infection + bacterial': 'cold', // Primary type
  'allergy + seasonal': 'allergies', // Primary type
  'allergy + food': 'digestion', // Related system
  'skin + dry': 'dry_skin', // Most specific
  'skin + oily': 'oily_skin', // Most specific
  'skin + sensitive': 'sensitive_skin', // Most specific
  'wound + healing': 'wounds', // Primary issue
  'scar + old': 'scars', // Primary issue
  'burn + recent': 'burns', // Primary issue
  'sun + damage': 'sunburn', // Primary issue
  'cellulite + reduction': 'cellulite', // Primary issue
  'vein + varicose': 'varicose_veins', // Primary issue
  'circulation + poor': 'circulation', // Primary issue
  'heart + palpitation': 'palpitations', // Primary issue
  'blood + pressure': 'hypertension', // Primary issue
  'thyroid + underactive': 'hypothyroid', // Most specific
  'thyroid + overactive': 'hyperthyroid', // Most specific
  'adrenal + exhausted': 'adrenal_fatigue', // Most specific
  'hormone + imbalance': 'menopause', // Most common
  'fertility + issues': 'fertility', // Primary issue
  'pregnancy + first': 'pregnancy', // Primary state
  'pregnancy + second': 'pregnancy', // Primary state
  'pregnancy + third': 'pregnancy', // Primary state
  'postpartum + healing': 'postpartum', // Primary state
  'breast + feeding': 'breastfeeding', // Primary state
  'milk + supply': 'lactation', // Primary issue
  'mastitis + infection': 'mastitis', // Primary issue
  'prostate + enlarged': 'prostate', // Primary issue
  'libido + low': 'libido', // Primary issue
  'performance + anxiety': 'impotence', // Primary issue
  'addiction + alcohol': 'addiction', // Primary issue
  'addiction + drug': 'addiction', // Primary issue
  'addiction + opioid': 'opioid', // Most specific
  'withdrawal + acute': 'withdrawal', // Primary issue
  'craving + sugar': 'cravings', // Primary issue
  'craving + carb': 'cravings', // Primary issue
  'detox + liver': 'detox', // Primary organ
  'detox + kidney': 'detox', // Primary organ
  'candida + oral': 'candida', // Primary issue
  'candida + vaginal': 'candida', // Primary issue
  'candida + systemic': 'candida', // Primary issue
  'parasite + intestinal': 'parasites', // Primary issue
  'lyme + chronic': 'lyme', // Primary issue
  'epstein + active': 'epstein', // Primary issue
  'shingles + active': 'shingles', // Primary issue
  'dementia + early': 'dementia', // Primary issue
  'dementia + moderate': 'dementia', // Primary issue
  'dementia + severe': 'dementia', // Primary issue
  'alzheimer + early': 'alzheimer', // Primary issue
  'parkinson + early': 'parkinson', // Primary issue
  'ms + relapsing': 'ms', // Primary type
  'ms + progressive': 'ms', // Primary type
  'als + early': 'als', // Primary issue
  'seizure + frequent': 'seizure', // Primary issue
  'epilepsy + controlled': 'epilepsy', // Primary issue
  'epilepsy + uncontrolled': 'epilepsy', // Primary issue
  'tremor + essential': 'tremor', // Primary type
  'tremor + parkinson': 'parkinson', // Primary cause
  'stroke + recent': 'stroke', // Primary issue
  'stroke + old': 'stroke', // Primary issue
  'concussion + acute': 'concussion', // Primary issue
  'concussion + chronic': 'concussion', // Primary issue
  'adhd + child': 'adhd', // Primary issue
  'adhd + adult': 'adhd', // Primary issue
  'add + inattentive': 'add', // Primary type
  'focus + poor': 'focus', // Primary issue
  'memory + poor': 'memory', // Primary issue
  'brain + fog': 'brain_fog', // Primary issue
  'concentration + poor': 'concentration', // Primary issue
  'learning + disability': 'learning', // Primary issue
  'autism + child': 'autism', // Primary issue
  'autism + adult': 'autism', // Primary issue
  'aspergers + mild': 'aspergers', // Primary issue
  'sensory + overload': 'sensory', // Primary issue
  'hypertension + mild': 'hypertension', // Primary issue
  'hypertension + severe': 'hypertension', // Primary issue
  'hypotension + orthostatic': 'hypotension', // Primary type
  'palpitation + occasional': 'palpitations', // Primary issue
  'palpitation + frequent': 'palpitations', // Primary issue
  'arrhythmia + benign': 'arrhythmia', // Primary issue
  'arrhythmia + serious': 'arrhythmia', // Primary issue
  'angina + stable': 'angina', // Primary issue
  'angina + unstable': 'angina', // Primary issue
  'chf + mild': 'chf', // Primary issue
  'chf + severe': 'chf', // Primary issue
  'circulation + cold': 'circulation', // Primary symptom
  'circulation + numb': 'circulation', // Primary symptom
  'varicose + mild': 'varicose_veins', // Primary issue
  'varicose + severe': 'varicose_veins', // Primary issue
  'blood + type': 'blood-type-a', // Default to type a
  'telomere + length': 'telomere', // Primary issue
  'unbroken + chronic': 'unbroken', // Primary issue
  'queen + energy': 'queen', // Primary issue
  'king + energy': 'king', // Primary issue
  'meditation + daily': 'meditation', // Primary practice
  'meditation + beginner': 'meditation', // Primary practice
  'grounding + needed': 'grounding', // Primary issue
  'energy + low': 'energy', // Primary issue
  'energy + high': 'energy', // Primary issue
  'chakra + balance': 'chakra', // Primary issue
  'aura + cleanse': 'aura', // Primary issue
  'protection + needed': 'protection', // Primary issue
  'xe + starter': 'xe' // Primary blend
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

// ✅ Helper: Detect condition from extensive alias mapping
function detectCondition(input) {
  if (!input || input.trim().length < 3) return null;
  
  const lowerInput = input.toLowerCase();
  
  // ✅ Check direct condition matches first
  if (ESSENTIAL_OILS[lowerInput]) {
    return lowerInput;
  }
  
  // ✅ Check all aliases
  for (const [condition, aliases] of Object.entries(CONDITION_ALIASES)) {
    for (const alias of aliases) {
      if (lowerInput.includes(alias)) {
        return condition;
      }
    }
  }
  
  // ✅ Check for multi-condition relationships
  const conditions = [];
  for (const [condition, aliases] of Object.entries(CONDITION_ALIASES)) {
    for (const alias of aliases) {
      if (lowerInput.includes(alias)) {
        conditions.push(condition);
      }
    }
  }
  
  // ✅ If multiple conditions detected, check relationships
  if (conditions.length > 1) {
    const comboKey = conditions.slice(0, 2).sort().join(' + ');
    if (CONDITION_RELATIONSHIPS[comboKey]) {
      return CONDITION_RELATIONSHIPS[comboKey];
    }
    // Default to first condition if no relationship mapping
    return conditions[0];
  }
  
  return conditions[0] || null;
}

// Blend name generator
function getBlendName(condition, userInput = null) {
  const names = {
    headache: "Serene Relief Therapy",
    migraine: "Migraine Soother",
    tension: "Tension Release Blend",
    musclepain: "Muscle Ease Blend",
    soreness: "Post-Workout Recovery",
    joint: "Joint Harmony Oil",
    arthritis: "Arthritis Relief Blend",
    sciatica: "Deep Relief Sciatic Soother",
    nervepain: "Nerve Calm Blend",
    neuropathy: "Neuropathy Support",
    backpain: "Back Relief Blend",
    neckpain: "Neck Tension Relief",
    shoulder: "Shoulder Freedom Floral Therapy",
    knee: "Knee Comfort Blend",
    injury: "Injury Recovery Blend",
    sprain: "Sprain Recovery Blend",
    strain: "Strain Relief Blend",
    tendonitis: "Tendon Support Blend",
    bursitis: "Bursitis Relief",
    plantar: "Plantar Fasciitis Relief",
    carpal: "Carpal Tunnel Relief",
    fibromyalgia: "Fibro Relief Blend",
    chronic_pain: "Chronic Pain Support",
    inflammation: "Inflammation Calm",
    swelling: "Swelling Reduction",
    stress: "Calm Mind Elixir",
    anxiety: "Anxiety Relief Blend",
    panic: "Panic Calm Blend",
    depression: "Mood Lift Elixir",
    mood: "Mood Balance Elixir",
    anger: "Anger Calm Blend",
    grief: "Heart Healing Blend",
    trauma: "Trauma Recovery Blend",
    overwhelm: "Overwhelm Relief",
    burnout: "Burnout Recovery",
    fatigue: "Energy Restore Blend",
    exhaustion: "Exhaustion Recovery",
    irritability: "Irritability Calm",
    frustration: "Frustration Release",
    loneliness: "Loneliness Comfort",
    sadness: "Sadness Lift Blend",
    fear: "Fear Calm Blend",
    worry: "Worry Release Blend",
    shock: "Shock Recovery",
    emotional: "Emotional Balance",
    insomnia: "Deep Sleep Serum",
    sleep: "Restful Sleep Blend",
    restless: "Restless Calm Blend",
    nightmares: "Peaceful Sleep Blend",
    sleeplessness: "Sleep Induction Blend",
    jetlag: "Jet Lag Recovery",
    shiftwork: "Shift Work Support",
    apnea: "Apnea Support Blend",
    snoring: "Snoring Reduction",
    dreams: "Dream Enhancement",
    menopause: "Menopause Balance Blend",
    hotflash: "Hot Flash Relief",
    pms: "PMS Balance Blend",
    cramps: "Cramp Relief Blend",
    period: "Period Comfort Blend",
    endometriosis: "Endo Support Blend",
    pcos: "PCOS Balance Blend",
    fertility: "Fertility Support Blend",
    pregnancy: "Pregnancy Calm Blend",
    postpartum: "Postpartum Healing",
    libido: "Intimacy Enhancement",
    impotence: "Performance Support",
    infertility: "Fertility Enhancement",
    miscarriage: "Miscarriage Healing",
    abortion: "Abortion Recovery",
    breastfeeding: "Breastfeeding Calm",
    lactation: "Lactation Support",
    mastitis: "Mastitis Relief",
    prostate: "Prostate Support",
    ed: "ED Support Blend",
    digestion: "Digestive Balance Elixir",
    bloating: "Bloat Relief Blend",
    nausea: "Nausea Calm Blend",
    ibs: "IBS Support Blend",
    constipation: "Regularity Support",
    diarrhea: "Digestive Calm Blend",
    heartburn: "Heartburn Relief",
    gerd: "GERD Support Blend",
    acid_reflux: "Acid Reflux Relief",
    indigestion: "Indigestion Relief",
    gas: "Gas Relief Blend",
    colitis: "Colitis Support",
    crohns: "Crohns Support",
    leaky_gut: "Leaky Gut Repair",
    sibo: "SIBO Support",
    congestion: "Congestion Clear",
    sinus: "Sinus Clear Blend",
    cold: "Cold Recovery Blend",
    flu: "Flu Support Blend",
    cough: "Cough Calm Blend",
    asthma: "Breath Easy Blend",
    allergies: "Allergy Relief Blend",
    bronchitis: "Bronchitis Support",
    pneumonia: "Pneumonia Recovery",
    pleurisy: "Pleurisy Relief",
    laryngitis: "Laryngitis Soother",
    sore_throat: "Sore Throat Relief",
    acne: "Clear Skin Blend",
    eczema: "Eczema Soothe Blend",
    psoriasis: "Psoriasis Support",
    rosacea: "Rosacea Calm Blend",
    aging: "Age Defying Serum",
    wrinkles: "Wrinkle Reduce Blend",
    scars: "Scar Fade Blend",
    burns: "Burn Healing Blend",
    wounds: "Wound Recovery Blend",
    dermatitis: "Dermatitis Relief",
    hives: "Hives Calm Blend",
    rash: "Rash Relief Blend",
    itching: "Itch Relief Blend",
    dry_skin: "Dry Skin Repair",
    oily_skin: "Oily Skin Balance",
    sensitive_skin: "Sensitive Skin Calm",
    sunburn: "Sunburn Relief",
    cellulite: "Cellulite Reduction",
    varicose: "Varicose Support",
    spider_veins: "Spider Vein Fade",
    glucose: "Glucose Balance Circulation Therapy",
    diabetes: "Diabetes Support Blend",
    metabolism: "Metabolism Boost Elixir",
    weight: "Weight Management Blend",
    thyroid: "Thyroid Support Blend",
    hypothyroid: "Hypothyroid Support",
    hyperthyroid: "Hyperthyroid Calm",
    adrenal: "Adrenal Calm Blend",
    adrenal_fatigue: "Adrenal Recovery",
    cushings: "Cushings Support",
    addisons: "Addisons Support",
    lupus: "The Unbroken Ointment",
    autoimmune: "Autoimmune Support",
    cfs: "Chronic Fatigue Support",
    longcovid: "Long COVID Recovery",
    opioid: "Opioid Recovery Blend",
    addiction: "Addiction Recovery",
    withdrawal: "Withdrawal Support",
    cravings: "Craving Control",
    detox: "Detox Support Blend",
    candida: "Candida Clear",
    parasites: "Parasite Cleanse",
    lyme: "Lyme Support Blend",
    epstein: "Epstein Barr Support",
    shingles: "Shingles Relief",
    dementia: "Dementia Support",
    alzheimer: "Alzheimer Support",
    parkinson: "Parkinson Support",
    ms: "MS Support Blend",
    als: "ALS Support Blend",
    seizure: "Seizure Calm",
    epilepsy: "Epilepsy Support",
    tremor: "Tremor Calm",
    stroke: "Stroke Recovery",
    concussion: "Concussion Healing",
    adhd: "ADHD Focus Blend",
    add: "ADD Focus Blend",
    focus: "Mental Focus Blend",
    memory: "Memory Enhancement",
    brain_fog: "Brain Fog Clear",
    concentration: "Concentration Boost",
    learning: "Learning Support",
    autism: "Autism Calm Blend",
    aspergers: "Aspergers Support",
    sensory: "Sensory Calm Blend",
    hypertension: "Blood Pressure Calm",
    hypotension: "Blood Pressure Boost",
    palpitations: "Heart Palpitation Calm",
    arrhythmia: "Arrhythmia Support",
    angina: "Angina Relief",
    chf: "Heart Failure Support",
    circulation: "Circulation Boost",
    varicose_veins: "Varicose Vein Support",
    'blood-type-a': "Blood Type A Blend",
    'blood-type-b': "Blood Type B Blend",
    'blood-type-o': "Blood Type O Blend",
    'blood-type-ab': "Blood Type AB Blend",
    telomere: "Telomere Repair Serum",
    unbroken: "The Unbroken Ointment",
    queen: "Queen's Oil",
    king: "The King's Oil",
    meditation: "Meditation Depth Blend",
    grounding: "Grounding Stability Blend",
    energy: "Energy Boost Blend",
    chakra: "Chakra Balance Blend",
    aura: "Aura Cleanse Blend",
    protection: "Spiritual Protection",
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
    anxiety: "Calms anxious thoughts and reduces physical symptoms of anxiety.",
    insomnia: "Encourages deep, restorative sleep and eases nighttime restlessness.",
    headache: "Relieves tension headaches and sinus pressure with cooling and anti-inflammatory action.",
    musclepain: "Eases muscle spasms and improves local circulation for faster recovery.",
    joint: "Supports joint mobility and reduces inflammation associated with cartilage stress.",
    digestion: "Aids digestive comfort and reduces bloating through gentle warming action.",
    menopause: "Balances hormonal fluctuations and eases hot flashes with floral synergy.",
    // ... (add more as needed, or use fallback)
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
  
  if (['headache', 'sciatica', 'migraine', 'nervepain', 'concussion', 'stroke'].includes(condition)) {
    note += " Avoid contact with eyes. If eye contact occurs, flush with a carrier oil, not water.";
  }
  if (['digestion', 'menopause', 'lupus', 'glucose', 'opioid', 'pregnancy', 'diabetes', 'thyroid', 'autoimmune', 'cfs', 'longcovid', 'addiction', 'cancer', 'chemo', 'heart', 'lung', 'kidney', 'liver'].includes(condition)) {
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
      // ✅ Detect condition from user input using extensive alias mapping
      const detectedCondition = detectCondition(userInput || condition);
      const selectedCondition = detectedCondition || condition || 'default';
      
      const oils = ESSENTIAL_OILS[selectedCondition] || ESSENTIAL_OILS.default;
      
      console.log('🔍 User input:', userInput);
      console.log('🔍 Condition received:', condition);
      console.log('🔍 Detected condition:', detectedCondition);
      console.log('🔍 Selected condition:', selectedCondition);
      console.log('🔍 Oils found:', oils ? 'YES' : 'NO');
      
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
          detectedCondition: detectCondition(userInput || condition),
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
    aliasCount: Object.values(CONDITION_ALIASES).reduce((sum, arr) => sum + arr.length, 0),
    relationshipCount: Object.keys(CONDITION_RELATIONSHIPS).length,
    timestamp: new Date().toISOString()
  });
}
