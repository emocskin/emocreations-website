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

// ✅✅✅ ULTIMATE ESSENTIAL OIL LIBRARY - 150+ CONDITIONS
const ESSENTIAL_OILS = {
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
  
  // === STRESS & EMOTIONS ===
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
  
  // === SLEEP ===
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
  
  // === HORMONAL & REPRODUCTIVE ===
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
  
  // === DIGESTIVE ===
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
  
  // === RESPIRATORY ===
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
  
  // === SKIN ===
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
  
  // === METABOLIC & CHRONIC ===
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
  
  // === NEUROLOGICAL ===
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
  
  // === MENTAL & COGNITIVE ===
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
  
  // === CARDIOVASCULAR ===
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
  
  // === SPECIALTY & ENERGETIC ===
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

// ✅✅✅ EXTENSIVE ALIAS MAPPING WITH SYMPTOM-BASED KEYWORDS
const CONDITION_ALIASES = {
  // === PAIN ALIASES (Expanded with symptoms) ===
  'sciatica': [
    'sciatic', 'sciatica', 'sciatic nerve', 'sciatic pain', 'piriformis',
    'lower back leg', 'shooting leg', 'radiating leg', 'leg pain from back',
    'buttock to leg', 'nerve pain leg', 'down the leg pain', 'shooting down leg',
    'radiating pain leg', 'leg numbness', 'leg tingling', 'leg weakness',
    'lower back shooting', 'back to leg', 'hip to leg', 'glute to leg'
  ],
  'backpain': [
    'back pain', 'back ache', 'lower back', 'low back', 'lumbar', 'upper back',
    'mid back', 'thoracic', 'spine pain', 'back stiffness', 'back tightness',
    'back spasm', 'back cramp', 'aching back', 'sore back', 'back injury',
    'disc pain', 'herniated disc', 'bulging disc', 'slipped disc', 'degenerative disc'
  ],
  'headache': [
    'head ache', 'head pain', 'migraine', 'tension head', 'sinus head',
    'pressure head', 'throbbing head', 'pounding head', 'cluster head',
    'vascular head', 'forehead pain', 'temple pain', 'behind eye pain',
    'one sided head', 'left head', 'right head', 'band around head',
    'vice grip head', 'tight head', 'heavy head', 'foggy head'
  ],
  'hotflash': [
    'hot flash', 'hot flashes', 'hotflush', 'hot flushes', 'night sweat',
    'night sweats', 'sudden heat', 'wave of heat', 'flushing', 'blushing',
    'feeling hot', 'overheating', 'temperature spike', 'sweating episodes',
    'menopausal heat', 'hormonal heat', 'internal heat', 'burning sensation'
  ],
  'menopause': [
    'menopause', 'menopausal', 'peri-menopause', 'perimenopause', 'post-menopause',
    'change of life', 'climacteric', 'hormone change', 'estrogen drop',
    'progesterone drop', 'ovarian decline', 'period stopping', 'cycles ending',
    'midlife change', 'women health', 'hormone transition', 'aging woman'
  ],
  'stress': [
    'stress', 'stressed', 'stressful', 'overwhelm', 'overwhelmed', 'pressure',
    'tension', 'strain', 'burnout', 'burnt out', 'too much', 'cant cope',
    'cant handle', 'work stress', 'life stress', 'emotional stress', 'mental stress',
    'chronic stress', 'acute stress', 'anxiety stress', 'worry stress'
  ],
  'insomnia': [
    'insomnia', 'insomniac', 'sleepless', 'sleeplessness', 'can\'t sleep',
    'cannot sleep', 'trouble sleeping', 'difficulty sleeping', 'poor sleep',
    'bad sleep', 'wake up', 'wake early', 'middle night wake', '3am wake',
    '4am wake', 'tossing turning', 'cant fall asleep', 'cant stay asleep',
    'restless sleep', 'light sleep', 'interrupted sleep', 'non-restorative sleep'
  ],
  // === SYMPTOM-ONLY ALIASES FOR INTELLIGENT MAPPING ===
  'pain_symptoms': [
    'aching', 'sore', 'tender', 'throbbing', 'stabbing', 'shooting', 'burning',
    'tingling', 'numb', 'weak', 'stiff', 'tight', 'cramping', 'spasming',
    'sharp pain', 'dull pain', 'constant pain', 'intermittent pain', 'worse at night',
    'worse with movement', 'better with rest', 'radiating', 'referred pain'
  ],
  'inflammation_symptoms': [
    'swelling', 'swollen', 'puffy', 'redness', 'warmth', 'heat', 'inflamed',
    'edema', 'fluid retention', 'water retention', 'pitting edema', 'joint swelling'
  ],
  'fatigue_symptoms': [
    'tired', 'exhausted', 'drained', 'depleted', 'lethargic', 'weak', 'no energy',
    'low energy', 'crashing', 'afternoon crash', 'wired tired', 'unrefreshing sleep',
    'heavy limbs', 'brain fog', 'mental fatigue', 'physical fatigue'
  ],
  'digestive_symptoms': [
    'bloating', 'bloated', 'gassy', 'gas', 'burping', 'belching', 'nausea',
    'queasy', 'upset stomach', 'cramping', 'diarrhea', 'constipation', 'irregular',
    'heartburn', 'reflux', 'indigestion', 'full', 'heavy stomach', 'gurgling'
  ],
  'respiratory_symptoms': [
    'congestion', 'stuffy', 'runny nose', 'sinus pressure', 'cough', 'wheezing',
    'shortness of breath', 'breathless', 'chest tight', 'chest congestion',
    'post nasal drip', 'sore throat', 'hoarse', 'phlegm', 'mucus'
  ],
  'skin_symptoms': [
    'itchy', 'itching', 'rash', 'redness', 'dry', 'flaky', 'oily', 'sensitive',
    'burning skin', 'tingling skin', 'numb skin', 'swollen skin', 'warm skin'
  ],
  'emotional_symptoms': [
    'anxious', 'worried', 'nervous', 'panicked', 'sad', 'down', 'blue', 'tearful',
    'angry', 'irritable', 'frustrated', 'overwhelmed', 'hopeless', 'worthless',
    'guilty', 'shame', 'lonely', 'isolated', 'disconnected', 'numb emotions'
  ]
};

// ✅ CONDITION RELATIONSHIP MAPPING
const CONDITION_RELATIONSHIPS = {
  'stress + insomnia': 'insomnia',
  'anxiety + panic': 'panic',
  'depression + fatigue': 'depression',
  'pain + inflammation': 'inflammation',
  'headache + tension': 'tension',
  'migraine + nausea': 'migraine',
  'pms + cramps': 'cramps',
  'menopause + hotflash': 'hotflash',
  'digestion + bloating': 'bloating',
  'ibs + constipation': 'ibs',
  'cold + congestion': 'congestion',
  'flu + fever': 'flu',
  'acne + scarring': 'acne',
  'aging + wrinkles': 'wrinkles',
  'diabetes + neuropathy': 'neuropathy',
  'thyroid + fatigue': 'thyroid',
  'autoimmune + inflammation': 'autoimmune',
  'adrenal + stress': 'adrenal',
  'back + sciatica': 'sciatica',
  'neck + headache': 'headache',
  'joint + arthritis': 'arthritis',
  'xe + starter': 'xe'
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
  
  // ✅ Step 1: Check direct condition matches
  if (ESSENTIAL_OILS[lowerInput]) {
    return lowerInput;
  }
  
  // ✅ Step 2: Check condition aliases (including symptom keywords)
  for (const [condition, aliases] of Object.entries(CONDITION_ALIASES)) {
    if (condition.endsWith('_symptoms')) continue;
    for (const alias of aliases) {
      if (lowerInput.includes(alias)) {
        return condition;
      }
    }
  }
  
  // ✅ Step 3: Check symptom-only aliases and map to most likely condition
  const symptomMatches = [];
  
  if (CONDITION_ALIASES.pain_symptoms?.some(sym => lowerInput.includes(sym))) {
    if (lowerInput.includes('back') || lowerInput.includes('spine') || lowerInput.includes('lumbar')) {
      symptomMatches.push('backpain');
    } else if (lowerInput.includes('head') || lowerInput.includes('migraine')) {
      symptomMatches.push('headache');
    } else if (lowerInput.includes('leg') || lowerInput.includes('sciatic') || lowerInput.includes('shooting')) {
      symptomMatches.push('sciatica');
    } else if (lowerInput.includes('joint') || lowerInput.includes('arthritis')) {
      symptomMatches.push('joint');
    } else {
      symptomMatches.push('musclepain');
    }
  }
  
  if (CONDITION_ALIASES.inflammation_symptoms?.some(sym => lowerInput.includes(sym))) {
    if (lowerInput.includes('joint')) {
      symptomMatches.push('arthritis');
    } else {
      symptomMatches.push('inflammation');
    }
  }
  
  if (CONDITION_ALIASES.fatigue_symptoms?.some(sym => lowerInput.includes(sym))) {
    if (lowerInput.includes('thyroid') || lowerInput.includes('hormone')) {
      symptomMatches.push('thyroid');
    } else if (lowerInput.includes('adrenal') || lowerInput.includes('stress')) {
      symptomMatches.push('adrenal');
    } else {
      symptomMatches.push('fatigue');
    }
  }
  
  if (CONDITION_ALIASES.digestive_symptoms?.some(sym => lowerInput.includes(sym))) {
    if (lowerInput.includes('ibs') || lowerInput.includes('irritable')) {
      symptomMatches.push('ibs');
    } else if (lowerInput.includes('reflux') || lowerInput.includes('heartburn')) {
      symptomMatches.push('gerd');
    } else {
      symptomMatches.push('digestion');
    }
  }
  
  if (CONDITION_ALIASES.respiratory_symptoms?.some(sym => lowerInput.includes(sym))) {
    if (lowerInput.includes('asthma') || lowerInput.includes('wheeze')) {
      symptomMatches.push('asthma');
    } else if (lowerInput.includes('allergy') || lowerInput.includes('pollen')) {
      symptomMatches.push('allergies');
    } else {
      symptomMatches.push('congestion');
    }
  }
  
  if (CONDITION_ALIASES.skin_symptoms?.some(sym => lowerInput.includes(sym))) {
    if (lowerInput.includes('acne') || lowerInput.includes('pimple')) {
      symptomMatches.push('acne');
    } else if (lowerInput.includes('eczema') || lowerInput.includes('atopic')) {
      symptomMatches.push('eczema');
    } else {
      symptomMatches.push('dry_skin');
    }
  }
  
  if (CONDITION_ALIASES.emotional_symptoms?.some(sym => lowerInput.includes(sym))) {
    if (lowerInput.includes('panic') || lowerInput.includes('attack')) {
      symptomMatches.push('panic');
    } else if (lowerInput.includes('depress') || lowerInput.includes('sad')) {
      symptomMatches.push('depression');
    } else {
      symptomMatches.push('stress');
    }
  }
  
  if (symptomMatches.length > 0) {
    return symptomMatches[0];
  }
  
  return null;
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
  if (['digestion', 'menopause', 'lupus', 'glucose', 'opioid', 'pregnancy', 'diabetes', 'thyroid', 'autoimmune', 'cfs', 'longcovid', 'addiction'].includes(condition)) {
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
