// app/blend/page.js
'use client';
// ✅ CRITICAL: Force dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

// ✅ Install with: npm install xrpl
import { Client } from 'xrpl';

export default function BlendPage() {
  const [product, setProduct] = useState(null);
  const [verificationState, setVerificationState] = useState('idle'); // idle | verifying | unlocked | insufficient
  const [xecBalance, setXecBalance] = useState(0);
  const [usdValue, setUsdValue] = useState(0);
  
  // ✅ Poe AI State
  const [userInput, setUserInput] = useState('');
  const [generatedBlend, setGeneratedBlend] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  
  // ✅✅✅ NEW: Unlock Flow State Variables
  const [showUnlockButton, setShowUnlockButton] = useState(false);
  const [unlockOptions, setUnlockOptions] = useState(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  
  const xummRef = useRef(null);
  const xrplClientRef = useRef(null);

  // ✅ XEC Token Configuration - CORRECT ISSUER
  const XEC_CONFIG = {
    currency: 'XEC',
    issuer: 'rJzq9Xwg1ZNRmSk5uyPoHdLDffpctv26CX', // ✅ YOUR XEC ISSUER
    requiredUsdThreshold: 25, // Minimum $25 USD worth of XEC
  };

  // ✅ Predefined blends
  const PREDEFINED_BLENDS = {
    'unbroken': { name: 'The Unbroken Ointment', price: 88, xec: 156, slug: 'unbroken' },
    'xe': { name: 'XE – Everybody\'s Oil', price: 38, xec: 67, slug: 'xe' },
    'queen': { name: 'Queen\'s Oil', price: 58, xec: 103, slug: 'queen' },
    'king': { name: 'The King\'s Oil', price: 58, xec: 103, slug: 'king' },
    'menopause': { name: 'Menopause Blend', price: 58, xec: 103, slug: 'menopause' },
    'sciatic': { name: 'Deep Relief Sciatic Soother', price: 88, xec: 156, slug: 'sciatic' },
    'telomere': { name: 'Telomere Repair Serum', price: 168, xec: 297, slug: 'telomere' },
    'joint': { name: 'Joint Ease Relief Elixir', price: 78, xec: 138, slug: 'joint' },
    'glucose': { name: 'Glucose Balance Circulation Therapy', price: 78, xec: 138, slug: 'glucose' },
    'shoulder': { name: 'Shoulder Freedom Floral Therapy', price: 88, xec: 156, slug: 'shoulder' },
    'headache': { name: 'Serene Relief Headache Therapy', price: 78, xec: 138, slug: 'headache' },
    'opioid': { name: 'Opioid Recovery Blend', price: 78, xec: 138, slug: 'opioid' },
    'blood-type-a': { name: 'Blood Type A Blend', price: 58, xec: 103, slug: 'blood-type-a' },
    'metabolism': { name: 'Metabolism Boost Elixir', price: 58, xec: 103, slug: 'metabolism' }
  };

  // ✅✅✅ EXTENSIVE CONDITION KEYWORD MAPPING (15-30+ keywords per condition)
  const detectCondition = (input) => {
    if (!input || input.trim().length < 3) return null;
    
    const lowerInput = input.toLowerCase();
    
    // ✅ Comprehensive keyword mappings with weighted scores
    const conditionMap = {
      'menopause': {
        weight: 0,
        keywords: [
          'menopause', 'menopausal', 'peri-menopause', 'perimenopause', 'post-menopause', 'postmenopause',
          'hot flash', 'hot flashes', 'hotflush', 'hot flushes', 'night sweat', 'night sweats',
          'hormone', 'hormones', 'hormonal', 'hormone imbalance', 'hormonal imbalance',
          'estrogen', 'progesterone', 'oestrogen', 'low estrogen', 'declining estrogen',
          'mood swing', 'mood swings', 'irritability', 'emotional roller', 'weepy', 'tearful',
          'vaginal dry', 'vaginal dryness', 'dryness down there', 'intimate dryness',
          'libido', 'low libido', 'sex drive', 'decreased desire',
          'bone density', 'bone loss', 'osteoporosis risk', 'weakening bones',
          'weight gain', 'metabolism slow', 'slower metabolism', 'belly fat', 'middle age spread',
          'brain fog', 'memory lapse', 'forgetful', 'concentration issue', 'mental fog',
          'heart palpitation', 'palpitations', 'racing heart ', 'irregular heartbeat',
          'hair thin', 'hair loss', 'thinning hair', 'dry skin', 'aging skin',
          'midlife', 'middle age', 'change of life', 'climacteric', 'menses stop',  'period stop',
          'periods irregular', 'irregular periods', 'missed period', 'cycle change'
        ]
      },
      'stress': {
        weight: 0,
        keywords: [
          'stress', 'stressed', ' stressful', 'overwhelm', 'overwhelmed', 'overwhelming',
          'anxiety', 'anxious', 'anxiousness', 'panic', 'panic attack', 'nervous', 'nervousness',
          'worry', 'worried', 'wor rying', 'fear', 'afraid', 'scared', 'frightened',
          'tension', 'tense', 'tightness', 'on edge', 'edgy', 'restless', 'agitated',
          'racing heart', 'heart pound', 'chest tigh t', 'short breath', 'breathless',
          'shaking', 'trembling', 'sweaty', 'clammy', 'cold sweat', 'hot flash',
          'muscle tight', 'tight shoulders', 'tight neck', 'jaw clench',  'teeth grind',
          'stomach knot', 'butterfly', 'nauseous', 'queasy', 'digestive issue',
          'can\'t focus', 'can not focus', 'distracted', 'scattered', 'racing thought', 'raci ng thoughts',
          'overthinking', 'ruminate', 'rumination', 'can\'t shut off', 'mind racing',
          'exhausted', 'burnout', 'burnt out', 'drained', 'depleted', 'fatigued', 'tired ',
          'insomnia', 'can\'t sleep', 'trouble sleeping', 'wake up', 'early morning wake',
          'irritable', 'snappy', 'short temper', 'anger', 'frustrated', 'frustration',
          ' cry', 'crying', 'tearful', 'emotional', 'moody', 'mood swing',
          'pressure', 'demanding', 'too much', 'can\'t cope', 'coping issue', 'handle',
          'work stress', 'job stress' , 'deadline', 'overworked', 'under pressure'
        ]
      },
      'headache': {
        weight: 0,
        keywords: [
          'headache', 'head ache', 'head pain', 'head hurting', 'hurting head',
           'migraine', 'migraines', 'migraine attack', 'migraine headache', 'hemiplegic',
          'tension headache', 'tension head', 'stress headache', 'pressure headache',
          'cluster  headache', 'sinus headache', 'sinus pressure', 'sinus pain',
          'hormone headache', 'menstrual migraine', 'period headache',
          'throbbing', 'pounding', 'pulsing', 'pulsatin g', 'stabbing', 'shooting',
          'pressure', 'tight band', 'vice grip', 'squeezing', 'constricting',
          'behind eye', 'eye pain', 'one side', 'unilateral', 'left side', 'right  side',
          'neck pain', 'stiff neck', 'shoulder pain', 'upper back pain',
          'light sensitive', 'sensitive to light', 'photophobia', 'sound sensitive',
          'nausea', 'nauseo us', 'vomiting', 'throw up', 'sick to stomach',
          'aura', 'visual disturbance', 'blurry vision', 'spots', 'flashes', 'zigzag',
          'dizzy', 'dizziness', 'vertigo', 'lighthead ed', 'faint',
          'congestion', 'stuffy nose', 'runny nose', 'sinus congestion',
          'trigger', 'triggered by', 'food trigger', 'wine trigger', 'chocolate trigger',
          'prev ent', 'prevention', 'prophylactic', 'frequency', 'chronic headache'
        ]
      },
      'sciatic': {
        weight: 0,
        keywords: [
          'sciatic', 'sciatica', 'sciatic nerve', 'sciatic  pain', 'sciatic nerve pain',
          'piriformis', 'piriformis syndrome', 'deep gluteal',
          'lower back', 'low back', 'lumbar', 'buttock', 'butt pain', 'glute pain',
          'hip p ain', 'leg pain', 'thigh pain', 'calf pain', 'foot pain',
          'shooting pain', 'radiating pain', 'traveling pain', 'down the leg',
          'one side', 'unilateral', 'left leg', 'ri ght leg',
          'burning', 'burning sensation', 'electric', 'electric shock', 'shooting',
          'tingling', 'pins and needles', 'numbness', 'numb', 'weakness', 'weak leg',
          's harp pain', 'stabbing', 'intense pain', 'severe pain',
          'sitting long', 'prolonged sitting', 'driving long', 'stand up', 'bend over',
          'lift heavy', 'lifting', 'twist', ' spinal', 'disc herniation', 'herniated disc',
          'bulging disc', 'slipped disc', 'spinal stenosis', 'bone Spur',
          'stretch help', 'stretching helps', 'walk help', 'lying do wn helps',
          'physical therapy', 'chiropractic', 'massage therapy', 'nerve glide'
        ]
      },
      'joint': {
        weight: 0,
        keywords: [
          'joint', 'joints', 'joint pain',  'joint pain relief', 'aching joints',
          'arthritis', 'osteoarthritis', 'rheumatoid arthritis', 'ra', 'oa',
          'gout', 'gouty', 'pseudogout', 'inflammatory arthritis',
           'bursitis', 'tendonitis', 'tendinitis', 'synovitis',
          'knee', 'knees', 'knee pain', 'knee arthritis', 'knee swelling',
          'hip', 'hips', 'hip pain', 'hip arthritis', 'hip r eplacement',
          'shoulder', 'shoulders', 'shoulder pain', 'frozen shoulder', 'rotator cuff',
          'elbow', 'elbows', 'elbow pain', 'tennis elbow', 'golfers elbow',
          'wrist ', 'wrists', 'wrist pain', 'carpal tunnel', 'hand pain',
          'finger', 'fingers', 'finger pain', 'knuckle pain', 'toe pain',
          'ankle', 'ankles', 'ankle pain', 'foot pain', ' heel pain',
          'spine', 'back', 'vertebrae', 'facet joint', 'spinal joint',
          'jaw', 'tmj', 'temporomandibular', 'jaw pain', 'clicking jaw',
          'stiff', 'stiffness', 'mor ning stiffness', 'stiff in morning', 'locked',
          'swelling', 'swollen', 'inflamed', 'inflammation', 'redness', 'warmth',
          'creaking', 'cracking', 'popping', 'grinding', 'b one on bone',
          'limited range', 'range of motion', 'can\'t bend', 'can\'t straighten',
          'weather sensitive', 'rain pain', 'cold weather', 'barometric pressure',
          'de generative', 'wear and tear', 'cartilage', 'synovial fluid',
          'autoimmune', 'systemic', 'chronic pain', 'flare up', 'flare-up'
        ]
      },
      'insomnia': {
        weight: 0,
        ke ywords: [
          'insomnia', 'insomniac', 'sleepless', 'sleeplessness', 'can\'t sleep',
          'can not sleep', 'trouble sleeping', 'difficulty sleeping', 'poor sleep',
          'bad sl eep', 'sleep problem', 'sleep issue', 'sleep disorder',
          'sleep deprivation', 'sleep deprived', 'lack of sleep', 'not enough sleep',
          'fall asleep', 'falling asleep', 'ca n\'t fall asleep', 'take forever',
          'toss and turn', 'restless', 'tossing', 'turning', 'wide awake',
          'mind racing', 'racing thoughts', 'can\'t shut off', 'overthinking', 
          'anxiety bedtime', 'nervous at night', 'bedtime anxiety',
          'stay asleep', 'staying asleep', 'wake up', 'waking up', 'frequent waking',
          'middle of night', '3am', ' 4am', 'early morning', 'wake early',
          'can\'t fall back', 'can\'t get back', 'up for hours', 'lie awake',
          'light sleeper', 'light sleep', 'deep sleep', 'rem sleep', 'sle ep cycle',
          'unrefreshing', 'not rested', 'groggy', 'grogginess', 'sleep hangover',
          'fatigue', 'tired', 'exhausted', 'daytime sleepiness', 'nap', 'napping',
          'energ y crash', 'afternoon crash', 'coffee dependent', 'caffeine',
          'noise sensitive', 'light sensitive', 'temperature', 'too hot', 'too cold',
          'partner snore', 'snoring', 'sl eep apnea', 'breathing issue',
          'screen time', 'blue light', 'phone before bed', 'tv in bed',
          'irregular schedule', 'shift work', 'jet lag', 'time zone',
          'bedtime  routine', 'wind down', 'relax before bed', 'sleep hygiene'
        ]
      },
      'musclepain': {
        weight: 0,
        keywords: [
          'muscle', 'muscles', 'muscle pain', 'muscle ache', 'mus cle aches',
          'sore muscle', 'sore muscles', 'muscle soreness', 'delayed onset', 'doms',
          'muscle spasm', 'spasm', 'cramp', 'cramps', 'charley horse', 'tight muscle',
           'muscle tight', 'muscle tension', 'knot', 'trigger point', 'myofascial',
          'neck pain', 'stiff neck', 'upper back', 'mid back', 'lower back',
          'shoulder pain', 'shoulder  blade', 'trap', 'trapezius', 'rhomboid',
          'chest pain', 'pec', 'pectoral', 'arm pain', 'bicep', 'tricep',
          'abdominal', 'abs', 'core', 'oblique', 'side pain', 'rib pain' ,
          'quad', 'quadriceps', 'hamstring', 'calf', 'shin', 'glute', 'glutes',
          'hip flexor', 'groin', 'inner thigh', 'outer thigh', 'it band',
          'workout', 'exercise', 'gy m', 'training', 'overuse', 'overworked',
          'strain', 'pulled muscle', 'torn muscle', 'injury', 'sports injury',
          'repetitive', 'repetition', 'same motion', 'typing', 'comp uter',
          'poor posture', 'posture issue', 'desk job', 'sitting all day',
          'heavy lift', 'lifting heavy', 'manual labor', 'physical work',
          'dehydration', 'electrolyte ', 'magnesium', 'potassium', 'mineral',
          'stress tension', 'emotional tension', 'hold tension', 'carry stress',
          'stretch', 'stretching', 'massage', 'foam roll', 'heat',  'ice',
          'rest', 'recovery', 'active recovery', 'physical therapy', 'chiropractic'
        ]
      },
      'digestion': {
        weight: 0,
        keywords: [
          'digest', 'digestion', 'dige stive', 'digestive issue', 'digestive problem',
          'gut', 'gut health', 'gut issue', 'stomach', 'stomach issue', 'stomach problem',
          'gi', 'gastrointestinal', 'gi tract', ' bowel', 'bowel movement', 'bm',
          'bloat', 'bloating', 'bloated', 'distended', 'gas', 'gassy', 'flatulence',
          'burp', 'burping', 'belch', 'belching', 'heartburn', 'acid re flux', 'gerd',
          'constipation', 'constipated', 'irregular', 'infrequent', 'hard stool',
          'diarrhea', 'loose stool', 'frequent bm', 'urgent', 'incontinence',
          'ibs',  'irritable bowel', 'ibd', 'crohn\'s', 'colitis', 'ulcerative',
          'sibo', 'small intestine', 'bacterial overgrowth', 'candida', 'yeast',
          'nausea', 'nauseous', 'queasy', 'u pset stomach', 'stomach ache',
          'vomiting', 'throw up', 'indigestion', 'dyspepsia', 'discomfort',
          'full', 'too full', 'early satiety', 'can\'t finish', 'heavy meal',
           'slow digestion', 'slow transit', 'food sit', 'sit like brick',
          'food sensitivity', 'food intolerance', 'trigger food', 'react to food',
          'gluten', 'dairy', 'lactose' , 'fructose', 'fodmap', 'histamine',
          'spicy food', 'fatty food', 'greasy', 'fried food', 'alcohol',
          'eat fast', 'eating fast', 'not chew', 'swallow air', 'carbonated',
           'abdominal pain', 'belly pain', 'cramping', 'cramps', 'stomach cramp',
          'rumbling', 'gurgling', 'borborygmi', 'stomach noise',
          'weight loss', 'unintended weight',  'malabsorption', 'nutrient deficiency',
          'probiotic', 'prebiotic', 'gut flora', 'microbiome', 'gut bacteria'
        ]
      },
      'shoulder': {
        weight: 0,
        keywords: [
          's houlder', 'shoulders', 'shoulder pain', 'shoulder ache', 'aching shoulder',
          'left shoulder', 'right shoulder', 'both shoulders', 'shoulder blade',
          'scapula', 'scapular' , 'upper back', 'between shoulder', 'shoulder blade pain',
          'frozen shoulder', 'adhesive capsulitis', 'rotator cuff', 'rotator cuff tear',
          'impingement', 'shoulder impin gement', 'bursitis', 'tendonitis', 'tendinitis',
          'labral tear', 'slap tear', 'shoulder instability', 'dislocation', 'subluxation',
          'arthritis shoulder', 'bone Spur', 'c alcification', 'calcific tendonitis',
          'reach overhead', 'can\'t reach', 'limited reach', 'above head',
          'reach behind', 'back pocket', 'bra clasp', 'seatbelt', 'zipper', 
          'reach across', 'opposite shoulder', 'cross body',
          'night pain', 'can\'t sleep shoulder', 'lie on shoulder', 'pressure pain',
          'stiff shoulder', 'shoulder stiffne ss', 'frozen', 'locked', 'can\'t move',
          'weakness', 'weak shoulder', 'drop thing', 'can\'t lift', 'lifting pain',
          'overhead work', 'painting', 'throwing', 'pitching', ' swimming',
          'tennis', 'golf', 'volleyball', 'baseball', 'repetitive overhead',
          'desk job', 'computer', 'typing', 'mouse', 'poor posture', 'rounded shoulder',
          'forw ard head', 'text neck', 'hunch', 'slouch', 'kyphosis',
          'injury', 'fall', 'accident', 'trauma', 'whiplash', 'sports injury',
          'post surgery', 'post op', 'after surgery',  'recovery', 'rehabilitation'
        ]
      },
      'glucose': {
        weight: 0,
        keywords: [
          'glucose', 'blood sugar', 'sugar level', 'glucose level', 'glucose monitoring',
          'd iabetes', 'diabetic', 'type 1', 'type 2', 'type 1 diabetes', 'type 2 diabetes',
          'prediabetes', 'pre-diabetes', 'borderline diabetic', 'insulin resistance',
          'metabolic s yndrome', 'metabolic disorder', 'insulin', 'insulin dependent',
          'high sugar', 'hyperglycemia', 'low sugar', 'hypoglycemia', 'blood sugar spike',
          'sugar crash', 'crash a fter eating', 'reactive hypoglycemia', 'roller coaster',
          'fasting glucose', 'postprandial', 'after meal', 'morning number', 'a1c', 'hba1c',
          'glucose monitor', 'cgm', 'c ontinuous monitor', 'finger stick', 'test strip',
          'thirsty', 'excessive thirst', 'polydipsia', 'frequent urination', 'polyuria',
          'hungry', 'excessive hunger', 'polyphag ia', 'always hungry', 'craving sugar',
          'blurry vision', 'vision change', 'tunnel vision', 'floaters',
          'tingling', 'numbness', 'neuropathy', 'nerve damage', 'pins and ne edles',
          'slow healing', 'slow wound', 'cut healing', 'infection prone',
          'fatigue', 'tired', 'exhausted', 'energy crash', 'afternoon crash',
          'weight gain', 'weight  loss', 'unexplained weight', 'belly fat', 'visceral fat',
          'carb count', 'carbohydrate', 'low carb', 'keto', 'ketogenic',
          'medication', 'metformin', 'insulin injection' , 'glucose tab', 'glucagon',
          'diet control', 'exercise', 'walking after meal', 'lifestyle change',
          'complication', 'retinopathy', 'nephropathy', 'cardiovascular', 'hear t disease',
          'circulation', 'poor circulation', 'blood flow', 'peripheral artery', 'pad'
        ]
      },
      'metabolism': {
        weight: 0,
        keywords: [
          'metabolism', 'metab olic', 'slow metabolism', 'fast metabolism', 'metabolism boost',
          'metabolic rate', 'bmr', 'basal metabolic', 'calorie burn', 'burn calories',
          'thyroid', 'thyroid issue' , 'hypothyroid', 'hyperthyroid', 'underactive thyroid',
          'overactive thyroid', 'thyroid hormone', 'tsh', 't3', 't4', 'hashimoto', 'graves',
          'weight gain', 'gain weight',  'can\'t lose', 'can\'t lose weight', 'weight loss',
          'lose weight', 'stubborn weight', 'plateau', 'weight plateau', 'hard to lose',
          'easy gain', 'gain easily', 'yo-yo',  'yo-yo diet', 'rebound weight',
          'belly fat', 'abdominal fat', 'visceral fat', 'middle weight', 'middle age spread',
          'body composition', 'muscle mass', 'lean mass', 'bo dy fat percentage',
          'low energy', 'fatigue', 'tired', 'exhausted', 'drained', 'depleted',
          'energy crash', 'afternoon slump', '3pm crash', 'need nap', 'always tired',
           'cold', 'cold hands', 'cold feet', 'temperature sensitive', 'can\'t get warm',
          'hot', 'overheated', 'heat intolerant', 'sweat excessive', 'night sweat',
          'slow diges tion', 'constipation', 'irregular bowel', 'bloating after eating',
          'food sit', 'heavy after meal', 'slow transit', 'motility issue',
          'appetite change', 'increased appet ite', 'decreased appetite', 'craving',
          'cortisol', 'stress hormone', 'adrenal', 'adrenal fatigue', 'hpa axis',
          'leptin', 'ghrelin', 'hunger hormone', 'satiety', 'fullne ss signal',
          'pcos', 'polycystic ovary', 'ovarian cyst', 'hormone imbalance', 'insulin resistance',
          'menopause metabolism', 'age related', 'slowing down', 'getting older ',
          'sedentary', 'inactive', 'desk job', 'sit all day', 'little exercise',
          'muscle loss', 'sarcopenia', 'aging muscle', 'strength training', 'build muscle',
          'diet' , 'calorie restriction', 'intermittent fasting', 'eating window',
          'supplement', 'metabolism booster', 'fat burner', 'thermogenic', 'green tea'
        ]
      },
      'lupus': {
        wei ght: 0,
        keywords: [
          'lupus', 'sle', 'systemic lupus', 'lupus erythematosus', 'autoimmune lupus',
          'lupus flare', 'flare up', 'flare-up', 'lupus symptoms', 'living wi th lupus',
          'autoimmune', 'autoimmune disease', 'autoimmune disorder', 'immune system',
          'overactive immune', 'immune attack', 'self attack', 'chronic autoimmune',
           'inflammatory', 'inflammation', 'systemic inflammation', 'chronic inflammation',
          'butterfly rash', 'malar rash', 'face rash', 'sun sensitivity', 'photosensitive',
          'sun  exposure', 'sun reaction', 'uv sensitive', 'rash after sun',
          'joint pain', 'joint swelling', 'arthritis lupus', 'morning stiffness',
          'fatigue', 'extreme fatigue', 'lupu s fatigue', 'crushing tired', 'exhausted',
          'fever', 'low grade fever', 'unexplained fever', 'temperature',
          'kidney', 'nephritis', 'lupus nephritis', 'protein urine', 'k idney issue',
          'chest pain', 'pleurisy', 'pleuritis', 'lung inflammation', 'short breath',
          'raynaud', 'raynaud\'s', 'cold fingers', 'cold toes', 'color change fingers',
           'mouth sore', 'mouth ulcer', 'nasal ulcer', 'canker sore',
          'hair loss', 'alopecia', 'thinning hair', 'patchy hair', 'lupus hair',
          'brain fog', 'cognitive', 'memor y issue', 'concentration', 'lupus fog',
          'headache', 'migraine', 'seizure', 'neurological', 'nervous system',
          'anemia', 'low blood count', 'white blood cell', 'platelet' , 'blood disorder',
          'hydroxychloroquine', 'plaquenil', 'prednisone', 'steroid', 'immunosuppressant',
          'biologic', 'benlysta', 'cellcept', 'methotrexate', 'medication',
           'rheumatologist', 'autoimmune specialist', 'regular monitoring', 'blood work',
          'trigger avoidance', 'stress management', 'rest', 'pacing', 'spoon theory',
          'invisib le illness', 'chronic illness', 'chronic pain', 'chronic fatigue',
          'support group', 'lupus warrior', 'lupus strong', 'butterfly community'
        ]
      },
      'opioid': {
        weight : 0,
        keywords: [
          'opioid', 'opioids', 'opiate', 'opiates', 'narcotic', 'narcotics',
          'recovery', 'recovering', 'recovery journey', 'in recovery', 'sobriety',
          ' sober', 'getting sober', 'stay sober', 'relapse', 'relapse prevention',
          'addiction', 'addicted', 'addiction recovery', 'substance abuse', 'substance use',
          'dependence',  'dependent', 'physical dependence', 'chemical dependence',
          'withdrawal', 'withdraw', 'detox', 'detoxing', 'withdrawal symptom',
          'cold turkey', 'coming off', 'tapering' , 'taper off', 'wean off',
          'muscle ache', 'bone pain', 'deep pain', 'restless leg', 'rls', 'leg jitter',
          'nausea', 'vomiting', 'diarrhea', 'stomach cramp', 'abdominal c ramp',
          'sweat', 'sweating', 'cold sweat', 'chills', 'goosebumps', 'flu-like',
          'anxiety', 'panic', 'agitation', 'irritability', 'mood swing', 'depression',
          'insomn ia', 'can\'t sleep', 'restless', 'toss and turn', 'yawning',
          'runny nose', 'watery eye', 'dilated pupil', 'sensitive to light',
          'craving', 'urge', 'trigger', 'drug seek ing', 'obsession',
          'pain management', 'chronic pain', 'pain relief', 'alternative pain',
          'non opioid', 'opioid free', 'natural pain', 'holistic pain',
          'nerve pain ', 'neuropathy', 'back pain', 'surgery recovery', 'injury pain',
          'physical therapy', 'massage', 'acupuncture', 'meditation', 'mindfulness',
          'mat', 'medication assisted' , 'suboxone', 'methadone', 'vivitrol', 'naloxone',
          'narcan', 'overdose prevention', 'harm reduction', 'needle exchange',
          'counseling', 'therapy', 'support group', 'na',  'narcotics anonymous',
          '12 step', 'sponsor', 'meeting', 'rehab', 'rehabilitation', 'treatment center',
          'family support', 'loved one', 'enabling', 'codependent', 'bound ary',
          'stigma', 'judgment', 'shame', 'guilt', 'self compassion', 'forgiveness',
          'wellness', 'holistic', 'mind body', 'healing journey', 'new life', 'second chance'
         ]
      },
      'blood-type-a': {
        weight: 0,
        keywords: [
          'blood type', 'bloodtype', 'type a', 'type a positive', 'type a negative',
          'a positive', 'a negative', 'blood  type diet', 'eat right 4 your type',
          'dadamo', 'peter dadamo', 'blood type nutrition', 'genotype diet',
          'sensitive', 'sensitive digestion', 'sensitive stomach', 'delica te digestion',
          'vegetarian', 'plant based', 'plant diet', 'meat sensitive', 'red meat issue',
          'low stomach acid', 'hypochlorhydria', 'digestive enzyme', 'enzyme deficie nt',
          'stress sensitive', 'high cortisol', 'adrenal issue', 'calming needed',
          'type a personality', 'perfectionist', 'type a trait', 'driven', 'ambitious',
          'heart  disease', 'cardiovascular', 'heart health', 'cholesterol', 'high cholesterol',
          'cancer prevention', 'cancer risk', 'immune support', 'low immune', 'infection prone',
          'd iabetes risk', 'insulin resistance', 'metabolic issue', 'weight gain',
          'thyroid', 'slow thyroid', 'thyroid support', 'metabolism slow',
          'bone health', 'osteoporosis', ' bo ne density', 'calcium',
          'avoid meat', 'limit meat', 'no red meat', 'fish okay', 'poultry okay',
          'dairy sensitive', 'limit dairy', 'no dairy', 'lactose issue',
          ' wheat issue', 'gluten sensitive', 'lectin', 'lectin sensitive',
          'alkaline', 'alkaline diet', 'acidic', 'balance ph', 'ph balance',
          'small meal', 'frequent meal', 'grazi ng', 'large meal hard', 'heavy meal',
          'calming food', 'soothing food', 'gentle food', 'easy digest',
          'calming exercise', 'yoga', 'tai chi', 'qigong', 'meditation', 'gen tle movement',
          'intense exercise', 'overdo exercise', 'too much cardio', 'cortisol spike',
          'routine', 'structured', 'schedule', 'regular meal', 'regular sleep',
          ' nature', 'outdoor', 'peaceful', 'quiet', 'low stress environment'
        ]
      },
      'telomere': {
        weight: 0,
        keywords: [
          'telomere', 'telomeres', 'telomere length', 'telom ere shortening', 'telomerase',
          'anti-aging', 'anti aging', 'age reversal', 'reverse aging', 'slow aging',
          'longevity', 'long life', 'life extension', 'healthy aging', ' graceful aging',
          'cellular aging', 'cell aging', 'biological age', 'chronological age',
          'cell', 'cells', 'cellular health', 'cell repair', 'cell regeneration',
          'd na', 'dna damage', 'dna repair', 'genetic', 'genome', 'epigenetic',
          'mitochondria', 'mitochondrial', 'energy production', 'cellular energy',
          'oxidative stress', 'free r adical', 'antioxidant', 'ros', 'reactive oxygen',
          'inflammation', 'chronic inflammation', 'inflammatory', 'anti-inflammatory',
          'wrinkle', 'wrinkles', 'fine line', 'agin g skin', 'skin aging', 'elasticity',
          'sagging', 'loose skin', 'age spot', 'sun damage', 'photoaging',
          'gray hair', 'grey hair', 'hair loss', 'thinning hair', 'hair agin g',
          'energy decline', 'lower energy', 'fatigue', 'slower recovery',
          'memory', 'cognitive decline', 'brain fog', 'mental sharpness', 'focus',
          'muscle loss', 'sarco penia', 'strength loss', 'frail', 'frailty',
          'bone loss', 'bone density', 'osteoporosis', 'joint stiffness',
          'stress management', 'chronic stress', 'cortisol', 'adrenal ', 'hpa axis',
          'sleep quality', 'deep sleep', 'sleep duration', 'circadian', 'melatonin',
          'exercise', 'physical activity', 'strength training', 'cardio', 'movement',
           'diet', 'nutrition', 'calorie restriction', 'intermittent fasting', 'fasting',
          'supplement', 'nmn', 'nr', 'resveratrol', 'metformin', 'rapamycin',
          'meditation', 'mi ndfulness', 'breathwork', 'relaxation', 'stress reduction',
          'social connection', 'community', 'purpose', 'ikigai', 'meaning',
          'environment', 'toxin', 'pollution', 'clea n living', 'organic', 'natural'
        ]
      },
      'unbroken': {
        weight: 0,
        keywords: [
          'unbroken', 'unbroken spirit', 'chronic illness', 'chronic disease',
          'invisibl e illness', 'hidden illness', 'unseen illness', 'spoonie', 'spoon theory',
          'flare', 'flare up', 'flare-up', 'symptom flare', 'bad day', 'crash',
          'chronic pain', 'chroni c fatigue', 'chronic symptom', 'lifelong condition',
          'autoimmune', 'autoimmune disease', 'immune disorder', 'immune system',
          'fibromyalgia', 'fms', 'fibro', 'myalgic',  'encephalomyelitis', 'me',
          'mecfs', 'chronic fatigue syndrome', 'post viral', 'long covid', 'long-haul',
          'pots', 'dysautonomia', 'autonomic', 'orthostatic', 'heart rate ', 'blood pressure',
          'ehlers danlos', 'eds', 'hypermobile', 'joint hypermobility', 'connective tissue',
          'mast cell', 'mcast', 'histamine', 'mcas', 'allergic', 'sensitiv ity',
          'pain', 'body pain', 'widespread pain', 'all over pain', 'aching', 'sore',
          'fatigue', 'exhaustion', 'extreme fatigue', 'crushing tired', 'wired tired',
          'bra in fog', 'cognitive', 'memory', 'concentration', 'mental fog', 'confusion',
          'sleep issue', 'unrefreshing', 'non-restorative', 'wake tired', 'insomnia',
          'sensitive', 'se nsitivity', 'light sensitive', 'sound sensitive', 'chemical sensitive',
          'overwhelm', 'overstimulated', 'sensory overload', 'too much', 'can\'t handle',
          'grief', 'loss',  'mourning', 'identity loss', 'old self', 'who i was',
          'isolation', 'alone', 'lonely', 'misunderstood', 'not believed', 'dismissed',
          'resilience', 'resilient', 'strengt h', 'strong', 'fighter', 'warrior',
          'healing', 'heal', 'healing journey', 'recovery', 'get better', 'improve',
          'acceptance', 'radical acceptance', 'new normal', 'adapt' , 'adjustment',
          'self compassion', 'self care', 'gentle', 'kindness', 'patience',
          'support', 'community', 'tribe', 'understood', 'seen', 'heard', 'validated',
          'ho pe', 'hopeful', 'possibility', 'better day', 'good day', 'window',
          'advocacy', 'awareness', 'visibility', 'speak up', 'share story', 'help others',
          'purpose', 'meaning' , 'why', 'reason', 'gift', 'lesson', 'growth', 'transformation'
        ]
      },
      'queen': {
        weight: 0,
        keywords: [
          'queen', 'queen energy', 'empress', 'goddess', 'divine  feminine', 'feminine',
          'self-love', 'love myself', 'self worth', 'self value', 'self esteem',
          'confidence', 'confident', 'empowerment', 'empowered', 'powerful', 'power' ,
          'inner strength', 'inner beauty', 'inner goddess', 'radiate', 'glow',
          'worthy', 'deserving', 'enough', 'i am enough', 'self acceptance',
          'heal', 'healing', 'emo tional healing', 'heart healing', 'past hurt',
          'trauma', 'heal trauma', 'wound', 'emotional wound', 'old pain',
          'forgive', 'forgiveness', 'let go', 'release', 'free', ' freedom',
          'boundary', 'boundaries', 'say no', 'protect energy', 'energy vampire',
          'self care', 'nurturing', 'nurture', 'tend', 'gentle', 'kind',
          'relationship', ' partnership', 'love', 'romantic', 'attraction', 'magnetic',
          'communication', 'express', 'voice', 'speak truth', 'authentic', 'real',
          'mother', 'motherhood', 'nurturing' , 'caregiver', 'giving', 'receiving',
          'sister', 'sisterhood', 'community', 'tribe', 'circle', 'support',
          'abundance', 'prosperity', 'manifest', 'attract', 'deserve good ',
          'sacred', 'sacred feminine', 'divine', 'spiritual', 'soul', 'spirit',
          'energy', 'vibration', 'frequency', 'align', 'alignment', 'flow',
          'intuition', 'intuitive ', 'inner wisdom', 'inner voice', 'trust',
          'ritual', 'ceremony', 'sacred space', 'altar', 'meditation', 'prayer',
          'rose', 'flower', 'bloom', 'blossom', 'petal', 'fragra nt', 'beautiful',
          'luxury', 'indulge', 'pamper', 'treat', 'special', 'precious', 'treasure'
        ]
      },
      'king': {
        weight: 0,
        keywords: [
          'king', 'king energy',  'emperor', 'divine masculine', 'masculine',
          'leader', 'leadership', 'lead', 'command', 'authority', 'power',
          'strength', 'strong', 'inner strength', 'core strength', ' solid', 'grounded',
          'confidence', 'confident', 'self-assured', 'certain', 'decisive', 'decide',
          'purpose', 'mission', 'vision', 'direction', 'path', 'calling', 'destiny ',
          'legacy', 'impact', 'influence', 'make mark', 'contribution', 'significance',
          'clarity', 'clear', 'mental clarity', 'focus', 'concentration', 'sharp',
          'discipl ine', 'disciplined', 'commitment', 'dedication', 'persistence',
          'courage', 'brave', 'fearless', 'bold', 'warrior', 'fighter',
          'honor', 'integrity', 'truth', 'honest', ' authentic', 'real', 'genuine',
          'wisdom', 'wise', 'knowledge', 'understanding', 'insight', 'discernment',
          'calm', 'composed', 'steady', 'stable', 'unshakeable', 'centere d',
          'protect', 'protection', 'protector', 'provide', 'provider', 'support',
          'father', 'fatherhood', 'paternal', 'guide', 'mentor', 'teach',
          'partner', 'partnershi p', 'brother', 'brotherhood', 'ally', 'team',
          'respect', 'respected', 'earn respect', 'command respect', 'dignity',
          'abundance', 'prosperity', 'success', 'achievement',  'accomplishment',
          'crown', 'crown chakra', 'third eye', 'solar plexus', 'root chakra',
          'energy', 'vitality', 'vigor', 'life force', 'chi', 'prana',
          'ground', 'gr ounding', 'earth', 'stable', 'rooted', 'foundation',
          'cedar', 'pine', 'wood', 'forest', 'mountain', 'stone', 'earth',
          'ritual', 'ceremony', 'sacred', 'spiritual', 'soul ', 'spirit',
          'sovereign', 'sovereignty', 'rule', 'reign', 'throne', 'kingdom', 'domain'
        ]
      }
    };
    
    // ✅ Weighted scoring algorithm
    let bestMatch = null;
    let bestScore = 0; 

    for (const [condition, data] of Object.entries(conditionMap)) {
      let score = 0;
      
      for (const keyword of data.keywords) {
        if (lowerInput.includes(keyword)) {
          score += keyword.split(' ').length > 1 ? 3 : 1;
          if (data.keywords.indexOf(keyword)  < 5) {
            score += 2;
          }
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = condition;
      }
    }

    return bestScore >= 3 ? bestMatch : null;
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const blendSlug = urlParams.get('blend') || 'xe';
    setProduct(PREDEFINED_BLENDS[blendSlug] || PREDEFINED_BLENDS['xe']);

    const initXrplClient = async () => {
      try {
        const client = new Client('wss://s1.ripple.com:51233');
        await client.connect();
        xrplClientRef.current = client;
      } catch (err) {
        console.error('Failed to connect to XRPL:', err);
      }
    };
    initXrplClient();

    return () => {
      if (xrplClientRef.current?.isConnected) {
        xrplClientRef.current.disconnect();
      }
    };
  }, []);

  // ✅ PayPal SDK loading
  useEffect(() => {
    if (typeof window === 'undefined' || !product) return;
    if (document.getElementById('paypal-sdk')) return;

    const script = document.createElement('script');
    script.id = 'paypal-sdk';
    script.src = 'https://www.paypal.com/sdk/js?client-id=ATmYVsWxvBzV6cJgPrC_AvCmCi9WfjP3u4Mv8uyME_mvlw0zBKQ06-BNylvCY_IOMoBuQFyPvdLM1xZ6&currency=USD';
    script.async = true;
    
    script.onload = () => {
      if (window.paypal) {
        window.paypal.Buttons({
          createOrder: (data, actions) => {
            const targetProduct = generatedBlend || product;
            return actions.order.create({
              purchase_units: [{
                amount: { value: targetProduct.price.toString(), currency_code: 'USD' },
                description: targetProduct.name
              }]
            });
          },
          onApprove: async (data, actions) => {
            try {
              const details = await actions.order.capture();
              const targetProduct = generatedBlend || product;
              
              await fetch('/api/submit-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: details.payer.email_address,
                  blend: targetProduct.slug || 'custom-ai-blend',
                  blendRecipe: generatedBlend?.recipe,
                  blendName: generatedBlend?.name,
                  blendDescription: generatedBlend?.description,
                  orderId: details.id,
                  paymentMethod: 'paypal',
                  usdValue: targetProduct.price,
                  price: targetProduct.price,
                })
              });
              window.location.href = `/thank-you?order=${details.id}`;
            } catch (err) {
              console.error('Order submission failed:', err);
              alert('Order confirmed but fulfillment failed. Please contact support.');
            }
          },
          onError: (err) => {
            console.error('PayPal error:', err);
            alert('Payment failed. Please try again.');
          }
        }).render('#paypal-button-container');
      }
    };
    
    document.body.appendChild(script);
    return () => {
      const el = document.getElementById('paypal-sdk');
      if (el) el.remove();
    };
  }, [product, generatedBlend]);

  // ✅✅✅ UPDATED: Generate Custom Blend with PREVIEW + UNLOCK Flow
  const handleGenerateBlend = async () => {
    if (!userInput.trim()) {
      setGenerationError('Please describe your wellness needs first.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedBlend(null);
    setShowUnlockButton(false);
    setUnlockOptions(null);

    try {
      // ✅ Detect condition from user input using extensive keyword mapping
      const detectedCondition = detectCondition(userInput);
      // ✅ Determine if we should use AI (long input with no clear match) or rule-based
      const useAI = userInput.length > 50 && !detectedCondition;
      
      // ✅ STEP 1: Request PREVIEW first (no auth required)
      const response = await fetch('/api/generate-blend', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-preview': 'true' // ✅ Request preview mode
        },
        body: JSON.stringify({
          condition: detectedCondition,
          scentPreference: null,
          skinType: null,
          userInput: userInput,
          useAI: useAI
        })
      });

      const data = await response.json();
      
      console.log('🧪 Preview Response:', data);

      // ✅ STEP 2: Handle preview response (402 Payment Required or 200 with preview)
      if (response.status === 402 || data.preview) {
        setGeneratedBlend({
          name: data.preview?.name || data.blend?.name || 'Custom Blend',
          description: data.preview?.description || data.blend?.description || 'Personalized blend for your wellness needs',
          price: data.preview?.price || data.blend?.price || 58,
          xec: data.preview?.xec || data.blend?.xec || 103,
          slug: data.preview?.slug || data.blend?.slug || 'preview-blend',
          preview: true, // ✅ Mark as preview
          recipe: [],
          instructions: null
        });
        
        setUnlockOptions(data.unlockOptions || {
          xec: {
            required: data.preview?.xec || data.blend?.xec || 103,
            usdThreshold: 25,
            connectWallet: '/api/unlock-xec'
          },
          paypal: {
            amount: data.preview?.price || data.blend?.price || 58,
            currency: 'USD',
            createOrder: '/api/submit-order'
          }
        });
        
        setShowUnlockButton(true);
        setGenerationError(null);
        return; // ✅ Stop here - user must unlock to see full recipe
      }

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      // ✅ STEP 3: Handle full blend response (already authorized)
      const blendData = data.blend;
      
      if (!blendData?.name || !blendData?.recipe || !Array.isArray(blendData.recipe)) {
        console.error('❌ Invalid blend structure:', blendData);
        throw new Error('Blend response missing required fields');
      }

      setGeneratedBlend({ ...blendData });
      setProduct({ ...blendData });
      
    } catch (error) {
      console.error('❌ Blend generation error:', error);
      setGenerationError(error.message || 'Failed to generate blend. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // ✅✅✅ FIXED: Handle Unlock After Preview (with proper Xamm auth)
  const handleUnlockBlend = async (paymentMethod) => {
    if (!generatedBlend?.slug) {
      setGenerationError('No blend to unlock. Please generate a blend first.');
      return;
    }
    
    setIsUnlocking(true);
    setGenerationError(null);

    try {
      if (paymentMethod === 'xec') {
        // ✅ Load Xumm SDK dynamically
        if (!window.Xumm) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://xaman.app/assets/cdn/xumm.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
        }

        const XUMM_API_KEY = process.env.NEXT_PUBLIC_XUMM_API_KEY || 'your-api-key-here';
        
        // ✅ Validate API key first
        if (!XUMM_API_KEY || XUMM_API_KEY === 'your-api-key-here' || XUMM_API_KEY.length < 10) {
          throw new Error('❌ Configuration Error:\n\nYour Xumm Wallet API key is not properly configured.\n\nPlease check Vercel environment variables → NEXT_PUBLIC_XUMM_API_KEY');
        }
        
        const xumm = new window.Xumm(XUMM_API_KEY);
        xummRef.current = xumm;

        console.log('🔐 Requesting Xumm authorization...');
        
        // ✅ STEP 1: Authorize Connection (Modern Promise Pattern - Removed .off() calls)
        let xrplAddress;
        try {
          const result = await xumm.authorize();
          
          console.log('✅ Authorization result:', result);
          
          if (!result || !result.account || !result.account.address) {
             // Fallback attempt if structure differs slightly
             if(result && result.transactionId) {
                 // Sometimes only transaction ID is returned first
                 // For now, we assume result.account exists
                 throw new Error('Authorization completed but account data missing. Try again.');
             } else {
                 throw new Error('Authorization failed or denied.');
             }
          }
          
          xrplAddress = result.account.address;
          
          if (!xrplAddress) {
            throw new Error('Account address not found in authorization result. Check permissions.');
          }
          
          console.log('✅ XRPL Address:', xrplAddress.slice(0, 10) + '...');
          
        } catch (authError) {
          console.error('❌ Xumm auth error:', authError);
          if (authError.message?.includes('timeout')) {
            throw new Error('Connection timed out. Please allow popups.');
          } else if (authError.message?.includes('popup')) {
            throw new Error('Popup blocked. Allow pop-ups for emocreations.skin.');
          }
          throw authError;
        }

        // ✅ STEP 2: Verify XEC balance via XRPL
        if (!xrplClientRef.current) {
            throw new Error('XRPL client not initialized');
        }
        
        const response = await xrplClientRef.current.request({
          method: 'account_lines',
          account: xrplAddress,
          peer: XEC_CONFIG.issuer,
        });

        let xecBalance = 0;
        const trustline = response.result.lines.find(
          line => line.currency === XEC_CONFIG.currency && line.account === XEC_CONFIG.issuer
        );
        
        if (trustline) {
          xecBalance = parseFloat(trustline.balance);
        }

        // Get XEC Price
        let xecPriceUsd = 0.0004;
        try {
          const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ecash&vs_currencies=usd');
          if (priceResponse.ok) {
            const priceData = await priceResponse.json();
            xecPriceUsd = priceData.ecash?.usd || priceData.xec?.usd || 0.0004;
          }
        } catch (e) {
          console.warn('Using fallback XEC price:', e);
        }
        
        const usdValue = xecBalance * xecPriceUsd;

        // ✅ Check threshold
        if (xecBalance >= generatedBlend.xec && usdValue >= XEC_CONFIG.requiredUsdThreshold) {
          // Save address for future unlocks
          localStorage.setItem('xrplAddress', xrplAddress);

          // Request FULL blend with address header
          const finalResponse = await fetch('/api/generate-blend', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-xrpl-address': xrplAddress
            },
            body: JSON.stringify({
              condition: detectCondition(userInput),
              userInput: userInput,
              useAI: userInput.length > 50
            })
          });

          if (!finalResponse.ok) {
            throw new Error('Final verification failed: ' + finalResponse.status);
          }

          const finalData = await finalResponse.json();
          setGeneratedBlend({ ...finalData.blend, preview: false });
          setProduct({ ...finalData.blend });
          setShowUnlockButton(false);
          
          alert(`✨ ${finalData.blend.name} unlocked! Your full recipe is ready.`);
          
        } else {
          setXecBalance(xecBalance);
          setUsdValue(usdValue);
          throw new Error(`Insufficient balance: Need ${generatedBlend.xec} XEC, have ${xecBalance.toFixed(2)} XEC`);
        }

      } else if (paymentMethod === 'paypal') {
        alert('Please complete PayPal checkout below. Your blend will unlock automatically.');
        const buttonContainer = document.getElementById('paypal-button-container');
        if (buttonContainer) {
          buttonContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setIsUnlocking(false);
        return;
      }

    } catch (error) {
      console.error('❌ Unlock error:', error);
      setGenerationError(error.message || 'Failed to unlock blend. See console for details.');
      
      // Better alert for common errors
      if (error.message.includes('Configuration Error')) {
          alert(error.message);
      } else if (error.message.includes('popup')) {
          alert('Please allow popups for emocreations.skin and try again.');
      } else if (error.message.includes('timed out')) {
          alert('Connection timed out. Please try again.');
      } else {
          alert(error.message);
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  // ✅ XEC Wallet Verification (for predefined blends)
  const handleVerifyWallet = async () => {
    const targetProduct = generatedBlend || product;
    if (!targetProduct || !xrplClientRef.current) {
      alert('Blend not ready. Please generate or select a blend first.');
      return;
    }

    setVerificationState('verifying');

    try {
      if (!window.Xumm) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://xaman.app/assets/cdn/xumm.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      const XUMM_API_KEY = process.env.NEXT_PUBLIC_XUMM_API_KEY || 'your-api-key-here';
      
      // ✅ Validate API key first
      if (!XUMM_API_KEY || XUMM_API_KEY === 'your-api-key-here' || XUMM_API_KEY.length < 10) {
        throw new Error('❌ Configuration Error:\n\nYour Xumm Wallet API key is not properly configured.\n\nPlease check Vercel environment variables → NEXT_PUBLIC_XUMM_API_KEY');
      }
      
      const xumm = new window.Xumm(XUMM_API_KEY);
      xummRef.current = xumm;

      console.log('🔐 Requesting Xumm authorization...');
      
      // ✅ STEP 1: Authorize Connection (Modern Promise Pattern - Removed .off() calls)
      let accountAddress;
      try {
        const result = await xumm.authorize();
        
        console.log('✅ Authorization result:', result);
        
        if (!result || !result.account || !result.account.address) {
          throw new Error('Authorization failed or denied.');
        }
        
        accountAddress = result.account.address;
        
        if (!accountAddress) {
          throw new Error('Account address not found in authorization result.');
        }
        
        console.log('✅ Account Address:', accountAddress.slice(0, 10) + '...');
        
      } catch (authError) {
        console.error('❌ Xumm auth error:', authError);
        if (authError.message?.includes('timeout')) {
          throw new Error('Connection timed out. Please allow popups.');
        } else if (authError.message?.includes('popup')) {
          throw new Error('Popup blocked. Allow pop-ups for emocreations.skin.');
        }
        throw authError;
      }

      // ✅ STEP 2: Verify XEC balance via XRPL
      const response = await xrplClientRef.current.request({
        method: 'account_lines',
        account: accountAddress,
        peer: XEC_CONFIG.issuer,
      });

      let xecBalance = 0;
      const trustline = response.result.lines.find(
        line => line.currency === XEC_CONFIG.currency && line.account === XEC_CONFIG.issuer
      );
      
      if (trustline) {
        xecBalance = parseFloat(trustline.balance);
      }

      let xecPriceUsd = 0.0004;
      try {
        const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ecash&vs_currencies=usd');
        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          xecPriceUsd = priceData.ecash?.usd
            || priceData['ecash']?.usd
            || priceData.xec?.usd
            || 0.0004;
        }
      } catch (e) {
        console.warn('Using fallback XEC price:', e);
      }
      
      const usdValue = xecBalance * xecPriceUsd;

      setXecBalance(xecBalance);
      setUsdValue(usdValue);

      if (xecBalance >= targetProduct.xec && usdValue >= XEC_CONFIG.requiredUsdThreshold) {
        setVerificationState('unlocked');
        
        await fetch('/api/verify-unlock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: accountAddress,
            blendSlug: targetProduct.slug,
            blendRecipe: generatedBlend?.recipe,
            blendName: generatedBlend?.name,
            blendDescription: generatedBlend?.description,
            blendInstructions: generatedBlend?.instructions,
            userPrompt: userInput,
            paymentMethod: 'xec',
            xecAmount: targetProduct.xec,
            usdValue: usdValue,
            price: targetProduct.price,
            requiredXec: targetProduct.xec,
          })
        });
        
        window.location.href = `/blend-delivery?blend=${targetProduct.slug}&verified=true&ai=${!!generatedBlend}&payment=xec`;
      } else {
        setVerificationState('insufficient');
        alert(`Insufficient XEC balance. Need ${targetProduct.xec} XEC (≈$${XEC_CONFIG.requiredUsdThreshold} USD). You have ${xecBalance.toFixed(2)} XEC (≈$${usdValue.toFixed(2)}).`);
      }

    } catch (error) {
      console.error('❌ Verification error:', error);
      setVerificationState('idle');
      
      if (error.message?.includes('timeout')) {
        alert('Wallet connection timed out. Please allow popups and try again.');
      } else if (error.message?.includes('popup') || error.message?.includes('blocked')) {
        alert('Please allow popups for emocreations.skin to connect your wallet.');
      } else if (error.message?.includes('Configuration Error')) {
        alert(error.message);
      } else {
        alert('Failed to verify wallet: ' + error.message);
      }
    }
  };

  const handleSelectPredefined = (slug) => {
    setGeneratedBlend(null);
    setUserInput('');
    setShowUnlockButton(false);
    setUnlockOptions(null);
    setProduct(PREDEFINED_BLENDS[slug]);
    setVerificationState('idle');
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Loading blend details...</p>
      </div>
    );
  }

  const targetProduct = generatedBlend || product;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Banner */}
      <div
        className="relative h-80 flex items-center justify-center"
        style={{
          backgroundImage: `url('/about-xec-banner.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
        <div className="absolute top-6 left-6 z-20">
          <img src="/xec-logo.png" alt="XEC Token" className="h-10 w-auto" />
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {generatedBlend ? (generatedBlend.preview ? '🔒 Preview: ' : '✨ ') + (generatedBlend.name || targetProduct.name) : targetProduct.name}
          </h1>
          <p className="text-lg text-gray-300">
            {generatedBlend
              ? (generatedBlend.preview ? 'Unlock with XEC or PayPal to see full recipe' : 'Personalized for your wellness journey. Powered by AI + $XEC.')
              : 'Unlock this AI-curated blend. Powered by $XEC.'}
          </p>
        </div>
      </div>

      {/* AI Blend Generator */}
      {!generatedBlend && (
        <section className="py-12 px-6 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl border border-turquoise/30 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-turquoise">🤖 Create Your Custom Blend</h2>
            <p className="text-gray-300 mb-4">
              Describe your wellness goals, pain points, or desired effects. Our AI will craft a personalized essential oil recipe just for you.
            </p>
            
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="e.g., I need relief from evening anxiety and trouble sleeping, with a calming floral scent..."
              className="w-full h-32 p-4 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-turquoise focus:border-transparent resize-none mb-4"
            />
            
            {generationError && (
              <p className="text-red-400 text-sm mb-3">{generationError}</p>
            )}
            
            <button
              onClick={handleGenerateBlend}
              disabled={isGenerating || !userInput.trim()}
              className="w-full bg-turquoise hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-black py-3 px-4 rounded font-medium transition flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Crafting your blend...
                </>
              ) : (
                '✨ Generate My AI Blend'
              )}
            </button>
            
            <p className="text-xs text-gray-500 mt-3 text-center">
              Powered by emocreations.skin_ai • Results vary • Not medical advice
            </p>
          </div>
        </section>
      )}

      {/* ✅✅✅ Blend Recipe Display with PREVIEW + UNLOCK UI */}
      {(generatedBlend || !generatedBlend) && (
        <div className="py-12 px-6 max-w-4xl mx-auto">
          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4">
              {generatedBlend ? (generatedBlend.preview ? '🔒 Preview: ' : 'Your Personalized Recipe: ') : 'Blend Includes:'}
              {generatedBlend?.name || targetProduct.name}
            </h2>
            
            {generatedBlend ? (
              <>
                <p className="text-gray-300 mb-4 italic">{generatedBlend.description}</p>
                
                {/* ✅ Show price/XEC requirement */}
                <div className="bg-black/50 p-4 rounded-lg mb-4 border border-turquoise/30">
                  <p className="text-sm text-gray-300">
                    <span className="font-semibold text-turquoise">Price:</span> ${generatedBlend.price} USD 
                    <span className="mx-2">•</span>
                    <span className="font-semibold text-turquoise">Or:</span> {generatedBlend.xec} XEC
                  </p>
                </div>
                
                {/* ✅ Show full recipe only if not preview */}
                {!generatedBlend.preview ? (
                  <>
                    <h3 className="text-lg font-semibold mb-4">Your Personalized Recipe:</h3>
                    <ul className="text-gray-300 space-y-3 mb-6">
                      {generatedBlend.recipe.map((item, idx) => (
                        <li key={idx} className="flex justify-between border-b border-gray-800 pb-2">
                          <span>• {item.oil} — {item.purpose}</span>
                          <span className="text-turquoise font-medium">{item.drops} drops</span>
                        </li>
                      ))}
                    </ul>
                    <div className="bg-black p-4 rounded-lg mb-4">
                      <p className="text-sm text-gray-400"><strong>How to use:</strong> {generatedBlend.instructions}</p>
                    </div>
                    {generatedBlend.notes && (
                      <div className="bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-lg mb-4">
                        <p className="text-xs text-yellow-200">{generatedBlend.notes}</p>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setGeneratedBlend(null);
                        setUserInput('');
                        setShowUnlockButton(false);
                        setUnlockOptions(null);
                        setProduct(PREDEFINED_BLENDS['xe']);
                      }}
                      className="text-sm text-gray-400 hover:text-turquoise underline"
                    >
                      ← Try a different blend
                    </button>
                  </>
                ) : (
                  // ✅ Preview mode: Show teaser + unlock buttons
                  <div className="text-center py-6">
                    <div className="bg-gray-800/50 p-6 rounded-xl mb-6 border border-gray-700">
                      <p className="text-gray-400 mb-2 text-lg">🔒 Full Recipe Locked</p>
                      <p className="text-gray-500 text-sm mb-4">
                        Complete recipe, instructions, and usage guide are unlocked with payment.
                      </p>
                      <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
                        <span>✨ {generatedBlend.xec} XEC</span>
                        <span>•</span>
                        <span>💳 ${generatedBlend.price} USD</span>
                      </div>
                    </div>
                    
                    {showUnlockButton && unlockOptions && (
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {/* XEC Unlock Button */}
                        <button
                          onClick={() => handleUnlockBlend('xec')}
                          disabled={isUnlocking}
                          className="bg-turquoise hover:bg-teal-400 disabled:opacity-50 text-black py-3 px-6 rounded font-medium transition flex items-center justify-center gap-2"
                        >
                          {isUnlocking ? (
                            <>
                              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                              Connecting...
                            </>
                          ) : (
                            '🪙 Unlock with XEC'
                          )}
                        </button>
                        
                        {/* PayPal Unlock Button */}
                        <button
                          onClick={() => handleUnlockBlend('paypal')}
                          disabled={isUnlocking}
                          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 px-6 rounded font-medium transition flex items-center justify-center gap-2"
                        >
                          {isUnlocking ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            '💳 Pay with PayPal'
                          )}
                        </button>
                      </div>
                    )}
                    
                    <button
                      onClick={() => {
                        setGeneratedBlend(null);
                        setUserInput('');
                        setShowUnlockButton(false);
                        setUnlockOptions(null);
                      }}
                      className="text-sm text-gray-400 hover:text-turquoise underline mt-6"
                    >
                      ← Try a different blend
                    </button>
                  </div>
                )}
              </>
            ) : (
              <ul className="text-gray-300 space-y-2">
                {targetProduct.name === 'XE – Everybody\'s Oil' && (
                  <>
                    <li>• 10 drops Lavender — calms nerves, reduces inflammation</li>
                    <li>• 8 drops Roman Chamomile — soothes tissue</li>
                    <li>• 6 drops Bergamot FCF — uplifts mood</li>
                  </>
                )}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Payment Options */}
      <section className="py-12 px-6 bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">Unlock With</h2>
          
          {/* XEC Option */}
          <div className="bg-black p-6 rounded-2xl border border-gray-800 mb-8">
            <h3 className="text-xl font-bold mb-4 text-turquoise">Unlock with $XEC</h3>
            <p className="text-gray-400 mb-4">
              Hold {targetProduct.xec} XEC (≈${XEC_CONFIG.requiredUsdThreshold} USD) to unlock instantly.
              {generatedBlend && <span className="block mt-2 text-sm text-turquoise">✨ AI-generated blends require the same XEC threshold</span>}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleVerifyWallet}
                disabled={verificationState === 'verifying'}
                className="flex-1 bg-turquoise hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-black py-3 px-4 rounded font-medium transition"
              >
                {verificationState === 'verifying' ? '⏳ Connecting...' : '✅ Pay with XEC'}
              </button>
              <Link
                href="/get-started"
                className="flex-1 text-center border border-turquoise text-turquoise hover:bg-turquoise/10 py-3 px-4 rounded font-medium transition"
              >
                🪙 Get XEC
              </Link>
            </div>

            {verificationState === 'unlocked' && (
              <div className="mt-4 text-green-400">
                ✅ Unlocked! You hold {xecBalance.toFixed(2)} XEC (${usdValue.toFixed(2)})
              </div>
            )}

            {verificationState === 'insufficient' && (
              <div className="mt-4 text-red-400">
                ❌ Insufficient balance. Need {targetProduct.xec} XEC.
                <br />
                <Link href="/get-started" className="text-turquoise hover:underline mt-1 inline-block">
                  Get more XEC →
                </Link>
              </div>
            )}
          </div>

          {/* PayPal Option */}
          <div className="bg-black p-6 rounded-2xl border border-gray-800">
            <h3 className="text-xl font-bold mb-4">Or Pay with Card</h3>
            <p className="text-gray-400 mb-4">
              Secure checkout via PayPal. Ships in 3–5 days.
              {generatedBlend && <span className="block mt-2 text-sm text-turquoise">✨ Your custom AI recipe will be included</span>}
            </p>
            <div id="paypal-button-container" className="text-center"></div>
          </div>
        </div>
      </section>

      {/* Predefined Blends Quick Select */}
      {!generatedBlend && (
        <section className="py-12 px-6 max-w-4xl mx-auto">
          <h3 className="text-xl font-bold mb-4 text-center">Or Choose a Predefined Blend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(PREDEFINED_BLENDS).slice(0, 8).map(([slug, blend]) => (
              <button
                key={slug}
                onClick={() => handleSelectPredefined(slug)}
                className={`p-3 rounded-lg border text-sm transition ${
                  product.slug === slug
                    ? 'border-turquoise bg-turquoise/10 text-turquoise'
                    : 'border-gray-700 hover:border-turquoise hover:bg-gray-800'
                }`}
              >
                {blend.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Trust & Compliance */}
      <section className="py-8 px-6 text-center text-gray-500 text-sm">
        <p>
          Formulated with cellular wellness in mind. Not a treatment. Complementary support only.
          <br />
          Consult your healthcare provider before use. AI suggestions are for entertainment and wellness exploration.
        </p>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 text-center text-gray-500 text-sm border-t border-gray-800">
        <p className="mb-4">
          Follow the science:
          <a href="https://instagram.com/emocreations.skin" target="_blank" rel="noopener" className="text-turquoise hover:underline ml-2">@emocreations.skin</a> •
          <a href="https://tiktok.com/@emocreations.skin" target="_blank" rel="noopener" className="text-turquoise hover:underline ml-2">@emocreations.skin</a>
        </p>
        <p>© 2025 EmoCreations.skin — Crafted with cellular wellness in mind.</p>
      </footer>
    </div>
  );
}
