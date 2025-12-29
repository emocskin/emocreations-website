// app/blend/app/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BlendAppPage() {
  const router = useRouter();

  // Check access (in real app: validate session or Supabase unlock)
  // For demo: assume access granted after paywall
  const hasAccess = true;

  if (!hasAccess) {
    router.push('/blend');
    return null;
  }

  const [condition, setCondition] = useState('');
  const [customCondition, setCustomCondition] = useState('');
  const [scentPreference, setScentPreference] = useState('');
  const [skinType, setSkinType] = useState('normal');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blendResult, setBlendResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (condition !== 'custom') {
      alert('⚠️ For a fully personalized blend, please select “Other / Custom” under “Select a health condition.”');
      return;
    }
    if (!customCondition.trim()) {
      alert('Please describe your condition or wellness goal.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/generate-blend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          condition: customCondition,
          scentPreference,
          skinType,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setBlendResult(data.blendData);
      } else {
        setError('Failed to generate blend. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">AI Wellness Blending Assistant</h1>
        <p className="text-gray-400 text-center mb-8">
          Crafted with cellular wellness in mind.
        </p>

        {!blendResult ? (
          <form onSubmit={handleSubmit} className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Select a health condition:
              </label>
              <select
                value={condition}
                onChange={(e) => {
                  const val = e.target.value;
                  setCondition(val);
                  setShowCustomInput(val === 'custom');
                }}
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-turquoise"
                required
              >
                <option value="">-- Select a condition --</option>
                <option value="stress">Stress & Anxiety</option>
                <option value="insomnia">Insomnia & Sleep Issues</option>
                <option value="headache">Headaches & Migraines</option>
                <option value="musclepain">Muscle Pain & Tension</option>
                <option value="joint">Joint Pain & Inflammation</option>
                <option value="digestion">Digestive Issues</option>
                <option value="respiratory">Respiratory Problems</option>
                <option value="skincare">Skin Conditions</option>
                <option value="immunity">Immune Support</option>
                <option value="energy">Low Energy & Fatigue</option>
                <option value="mood">Mood Enhancement</option>
                <option value="hormonal">Hormonal Balance</option>
                <option value="circulation">Poor Circulation</option>
                <option value="detox">Detoxification</option>
                <option value="memory">Memory & Focus</option>
                <option value="custom">Other / Custom</option>
              </select>
            </div>

            {showCustomInput && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Describe your condition, symptoms, or desired wellness outcome:
                </label>
                <textarea
                  value={customCondition}
                  onChange={(e) => setCustomCondition(e.target.value)}
                  rows="4"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-turquoise"
                  placeholder="Example: I have abdominal cramping and nerve pain from lupus. I need something calming for bedtime with a light floral scent..."
                  required
                />
                <p className="text-turquoise text-sm mt-2">
                  🔑 For full personalization, make sure “Other / Custom” is selected above.
                </p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Preferred scent profile (optional):
              </label>
              <select
                value={scentPreference}
                onChange={(e) => setScentPreference(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-turquoise"
              >
                <option value="">No preference</option>
                <option value="floral">Floral (Lavender, Rose, Jasmine)</option>
                <option value="citrus">Citrus (Orange, Lemon, Grapefruit)</option>
                <option value="woody">Woody (Cedarwood, Sandalwood)</option>
                <option value="herbal">Herbal (Peppermint, Eucalyptus, Rosemary)</option>
                <option value="spicy">Spicy (Cinnamon, Clove, Ginger)</option>
                <option value="sweet">Sweet (Vanilla, Bergamot)</option>
                <option value="earthy">Earthy (Patchouli, Vetiver)</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Skin Type:
              </label>
              <select
                value={skinType}
                onChange={(e) => setSkinType(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-turquoise"
              >
                <option value="normal">Normal</option>
                <option value="dry">Dry</option>
                <option value="oily">Oily</option>
                <option value="sensitive">Sensitive</option>
                <option value="combination">Combination</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-turquoise text-black font-bold py-3 rounded-lg hover:bg-teal-400 transition disabled:opacity-50"
            >
              {loading ? 'Creating Your Blend...' : 'Generate AI Blend'}
            </button>
          </form>
        ) : (
          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
            <h2 className="text-2xl font-bold mb-4">{blendResult.blendName}</h2>
            <p className="text-gray-300 mb-6">{blendResult.benefits}</p>
            <h3 className="font-medium mb-2">Ingredients:</h3>
            <ul className="list-disc pl-5 mb-6 text-gray-300">
              <li><strong>Base:</strong> {blendResult.baseOil}</li>
              {blendResult.ingredients.map((ing, i) => (
                <li key={i}>{ing.name} ({ing.amount}) — {ing.purpose}</li>
              ))}
            </ul>
            <p className="text-gray-300"><strong>How to Use:</strong> {blendResult.instructions}</p>
            <p className="text-gray-400 text-sm mt-4">
              Formulated with cellular wellness in mind. Not a treatment. For complementary use only.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setBlendResult(null)}
                className="px-4 py-2 border border-turquoise text-turquoise rounded"
              >
                Create Another
              </button>
              <button className="px-4 py-2 bg-turquoise text-black rounded font-medium">
                Order This Blend
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
