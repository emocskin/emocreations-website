"use client";

import React, { useState, useRef } from "react";

// Note: Ensure NEXT_PUBLIC_XUMM_API_KEY is in your .env.local file
const XUMM_API_KEY = process.env.NEXT_PUBLIC_XUMM_API_KEY || "6d812a43-15c8-4f20-9028-9ae4382049cf";

// ✅ Type definitions for full IDE autocomplete and safety
interface Oil {
  oil: string;
  drops: number;
  purpose: string;
}

interface BlendData {
  name: string;
  description: string;
  recipe: Oil[] | null;
  instructions: string | null;
  notes: string | null;
  xec: number;
  price: number;
  slug: string;
  isPreview: boolean;
}

export default function BlendGenerator() {
  // State variables
  const [userInput, setUserInput] = useState("");
  const [blendData, setBlendData] = useState<BlendData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  
  // Ref for Xumm SDK instance (Singleton)
  const xummRef = useRef<any>(null);

  // Helper to detect condition (matches backend logic)
  const detectCondition = (input: string) => {
    const lower = input.toLowerCase();
    if (lower.includes("stress")) return "stress";
    if (lower.includes("sleep") || lower.includes("insomnia")) return "insomnia";
    if (lower.includes("headache")) return "headache";
    if (lower.includes("muscle")) return "musclepain";
    if (lower.includes("joint")) return "joint";
    if (lower.includes("digest")) return "digestion";
    if (lower.includes("menopause")) return "menopause";
    return "default";
  };

  // Helper to safely extract error messages
  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error) return err.message;
    return String(err) || "An unexpected error occurred.";
  };

  // ✅ Safely handle preview mode and prevent "missing required fields" crash
  const handleGenerateBlend = async () => {
    if (!userInput.trim()) {
      setError("Please enter a condition or symptom first.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-blend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condition: detectCondition(userInput),
          userInput: userInput,
          useAI: userInput.length > 50,
        }),
      });

      // ✅ Safely parse JSON to prevent SyntaxError on 502/504 HTML responses
      let data: any;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error(`Server returned an invalid response (HTTP ${response.status})`);
      }

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      // ✅ FIX: Handle Preview Mode gracefully (Backend returns `preview` object, not `blend`)
      if (data.preview) {
        console.log("✅ Preview generated. Awaiting unlock.");
        setBlendData({
          name: data.preview.name || "Custom Blend",
          description: data.preview.description || "Unlock to see full details.",
          price: data.preview.price || 0,
          xec: data.preview.xec || 0,
          slug: data.preview.slug || "preview",
          isPreview: true, 
          recipe: null,
          instructions: null,
          notes: null,
        });
        return; 
      }

      // Handle Full Unlocked Blend (if user already had balance)
      if (!data.blend?.name || !data.blend?.recipe || !Array.isArray(data.blend.recipe)) {
        throw new Error("Blend response missing required fields");
      }

      setBlendData({
        ...data.blend,
        isPreview: false,
      });

    } catch (err: unknown) {
      console.error("❌ Blend generation error:", err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Safe Xaman Authorization + Backend Delegation 
  const handleUnlockBlend = async (method: "xec" | "paypal") => {
    if (!blendData?.slug) {
      setError("No blend to unlock. Please generate a blend first.");
      return;
    }

    setIsUnlocking(true);
    setError(null);

    try {
      if (method === "xec") {
        // 1. BULLETPROOF SCRIPT LOADER: Prevents infinite hanging promises
        if (!(window as any).Xumm) {
          await new Promise<void>((resolve, reject) => {
            if ((window as any).Xumm) {
              resolve();
              return;
            }

            const existingScript = document.querySelector('script[src="https://xaman.app/assets/cdn/xumm.min.js"]');
            
            if (existingScript) {
              let attempts = 0;
              const poll = setInterval(() => {
                attempts++;
                if ((window as any).Xumm) {
                  clearInterval(poll);
                  resolve();
                } else if (attempts > 50) { // 5 seconds timeout
                  clearInterval(poll);
                  reject(new Error("Xaman SDK load timeout. Please refresh the page."));
                }
              }, 100);
              return;
            }

            const script = document.createElement("script");
            script.src = "https://xaman.app/assets/cdn/xumm.min.js";
            script.onload = () => {
              if ((window as any).Xumm) resolve();
              else reject(new Error("Xaman SDK loaded but failed to initialize."));
            };
            script.onerror = () => reject(new Error("Failed to load Xaman SDK. Please disable adblockers and try again."));
            document.body.appendChild(script);
          });
        }

        if (!XUMM_API_KEY || XUMM_API_KEY.length < 10) {
          throw new Error("❌ Configuration Error: Xumm API key is missing.");
        }

        // 2. SINGLETON PATTERN
        if (!xummRef.current) {
          xummRef.current = new (window as any).Xumm(XUMM_API_KEY);
        }
        const xumm = xummRef.current;

        console.log("🔐 Requesting Xaman authorization...");
        
        // 3. SAFE AUTHORIZATION
        const authResult = await xumm.authorize();

        if (!authResult?.account?.address) {
          if (authResult?.transactionId) {
            throw new Error("Authorization completed but account data is missing. Please try again.");
          }
          throw new Error("Authorization was denied or canceled. Please try again.");
        }

        const userWalletAddress = authResult.account.address;
        console.log("✅ XRPL Address verified:", userWalletAddress.slice(0, 10) + "...");
        
        // ✅ Safely handle localStorage in strict privacy modes
        try {
          localStorage.setItem("xrplAddress", userWalletAddress);
        } catch (e) {
          console.warn("Failed to save to localStorage (likely strict privacy mode):", e);
        }

        // 4. Call backend to verify balance and get the full recipe
        const verifyRes = await fetch("/api/generate-blend", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-xrpl-address": userWalletAddress,
          },
          body: JSON.stringify({
            condition: detectCondition(userInput),
            userInput: userInput,
            useAI: userInput.length > 50,
          }),
        });

        let responseData: any;
        try {
          responseData = await verifyRes.json();
        } catch (e) {
          throw new Error(`Server returned an invalid response (HTTP ${verifyRes.status})`);
        }

        if (!verifyRes.ok) {
          throw new Error(responseData.error || `Verification failed: ${verifyRes.status}`);
        }

        if (!responseData.blend?.name || !responseData.blend?.recipe) {
          throw new Error("Backend returned invalid blend data.");
        }

        setBlendData({
          ...responseData.blend,
          isPreview: false,
        });
        
        alert(`✨ ${responseData.blend.name} unlocked! Your full recipe is ready.`);

      } else if (method === "paypal") {
        alert("Please complete PayPal checkout below. Your blend will unlock automatically.");
        const paypalContainer = document.getElementById("paypal-button-container");
        if (paypalContainer) {
          paypalContainer.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    } catch (err: unknown) {
      console.error("❌ Unlock error:", err);
      const message = getErrorMessage(err);
      setError(message);
      
      if (message.includes("Configuration Error")) {
        alert(message);
      } else if (message.includes("popup") || message.includes("timed out") || message.includes("adblocker")) {
        alert("Connection timed out or blocked. Please allow pop-ups and disable adblockers for emocreations.skin and try again.");
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Input Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Describe your symptoms or wellness goal
        </label>
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="e.g., I have tension headaches and trouble sleeping..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          rows={4}
        />
        <button
          onClick={handleGenerateBlend}
          disabled={isLoading || !userInput.trim()}
          className="w-full py-3 px-6 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Generating Blend..." : "Generate My Custom Blend"}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Blend Display / Unlock UI */}
      {blendData && (
        <div className="p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{blendData.name}</h2>
          <p className="text-gray-600 mb-4">{blendData.description}</p>

          {blendData.isPreview ? (
            <div className="space-y-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800 font-medium">
                🔒 Unlock your full AI recipe, instructions, and carrier oil recommendations.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleUnlockBlend("xec")}
                  disabled={isUnlocking}
                  className="py-3 px-4 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUnlocking ? "Verifying..." : `Unlock with ${blendData.xec} XEC`}
                </button>
                <button
                  onClick={() => handleUnlockBlend("paypal")}
                  disabled={isUnlocking}
                  className="py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  Unlock with PayPal (${blendData.price})
                </button>
              </div>
              <div id="paypal-button-container" className="mt-4"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Your Custom Recipe:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {blendData.recipe?.map((oil: Oil, idx: number) => (
                    <li key={idx}>
                      <strong>{oil.oil}</strong>: {oil.drops} drops ({oil.purpose})
                    </li>
                  ))}
                </ul>
              </div>
              
              {blendData.instructions && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Instructions:</h3>
                  <p className="text-gray-600 text-sm">{blendData.instructions}</p>
                </div>
              )}
              
              {blendData.notes && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Safety Notes:</h3>
                  <p className="text-gray-600 text-sm italic">{blendData.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}