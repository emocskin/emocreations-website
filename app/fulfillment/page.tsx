"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// 1. Aligned with Canonical Supabase Schema (Nullable fields accounted for)
interface OrderData {
  id: string;
  status: string;
  xec_amount: number | null;
  email: string | null;
}

function OrderFulfillmentContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [email, setEmail] = useState("");
  const [wellnessGoal, setWellnessGoal] = useState("relaxation");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // 2. Securely verify the order is paid before showing the form
  useEffect(() => {
    let isMounted = true; // Prevents state updates on unmounted components

    if (!orderId) {
      if (isMounted) {
        setError("Missing Order ID. Please check your link or contact support.");
        setIsLoading(false);
      }
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) {
          throw new Error(res.status === 404 ? "Order not found" : "Failed to fetch order");
        }
        
        const data: OrderData = await res.json();
        
        if (isMounted) {
          // CRITICAL: Only show the form if the backend confirms it's paid/processing
          if (data.status === "paid" || data.status === "processing") {
            setOrder(data);
            setEmail(data.email || ""); // Safely handles null
          } else if (data.status === "pending") {
            throw new Error("Payment is still pending on the XRP Ledger. Please wait a moment and refresh.");
          } else {
            throw new Error(`Order status is '${data.status}'. Please contact support.`);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error("Order fetch error:", err);
          const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
          setError(errorMessage);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOrder();

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  // 3. Handle the final submission (Triggering the AI Agent & Email)
  const handleFinalizeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !email) return;

    setIsSubmitting(true);
    setError(null); // Clear previous errors

    try {
      const res = await fetch("/api/finalize-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          email,
          wellnessGoal,
          additionalNotes,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to finalize order");
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      console.error("Finalize order error:", err);
      // Sets error, but because 'order' is loaded, the form will stay visible!
      const errorMessage = err instanceof Error ? err.message : "There was an error saving your blend preferences. Please try again.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Render States
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
        <p className="text-gray-600">Verifying your order on the XRP Ledger...</p>
      </div>
    );
  }

  // FIX: Only show full-screen error if the order failed to load initially.
  // If 'order' exists, we skip this and render the form (which will display the error inline).
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-red-600 mb-2">Unable to Proceed</h2>
        <p className="text-gray-600 max-w-md">{error || "Order not found."}</p>
        <p className="text-gray-500 mt-4 text-sm">
          Need help? Contact us at{" "}
          <a href="mailto:emoc.xec@gmail.com" className="text-amber-600 hover:underline">
            emoc.xec@gmail.com
          </a>
        </p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">🌿</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your AI Blend is Brewing!</h2>
          <p className="text-gray-600 mb-6">
            Thank you! Our AI blending agent is analyzing your preferences. 
            A confirmation email with your custom formula and tracking details has been sent to{" "}
            <strong>{email}</strong>.
          </p>
          <p className="text-sm text-gray-500">Order ID: {orderId}</p>
        </div>
      </div>
    );
  }

  // Safely format the XEC amount. Uses != null to correctly handle '0' without triggering the fallback.
  const formattedXecAmount = order.xec_amount != null ? Number(order.xec_amount).toFixed(4) : "0.00";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-amber-50 to-white">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Customize Your AI Blend</h1>
          <p className="text-gray-600">
            Payment of <strong>{formattedXecAmount} XEC</strong> verified. Let's create your perfect scent.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleFinalizeOrder} className="space-y-6">
          
          {/* Email Capture */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address (For Order Confirmation)
            </label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          {/* Wellness Goal Selection (Accessibility Corrected) */}
          <div>
            <fieldset className="border-0 p-0 m-0">
              <legend className="block text-sm font-medium text-gray-700 mb-2">
                What is your primary wellness goal for this blend?
              </legend>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3" role="radiogroup" aria-label="Wellness Goal">
                {["relaxation", "energy", "sleep", "focus"].map((goal) => {
                  const isSelected = wellnessGoal === goal;
                  return (
                    <button
                      key={goal}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setWellnessGoal(goal)}
                      className={`px-4 py-3 rounded-lg border-2 capitalize transition-all ${
                        isSelected
                          ? "border-amber-500 bg-amber-50 text-amber-700 font-semibold ring-2 ring-amber-200"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      }`}
                    >
                      {goal}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>

          {/* Additional Notes for the AI */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes for our AI Blending Agent (Optional)
            </label>
            <textarea
              id="notes"
              rows={4}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="e.g., 'I prefer earthy scents like sandalwood, and I'm using this for evening meditation...'"
            />
          </div>

          {/* Error Display in Form (Now properly visible during submission failures) */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
              <span aria-hidden="true">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !email}
            className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-lg shadow-md hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Generating Blend...
              </>
            ) : (
              "Generate My Custom Blend"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// 5. Next.js App Router Requirement: Wrap useSearchParams in Suspense
export default function OrderFulfillmentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      }
    >
      <OrderFulfillmentContent />
    </Suspense>
  );
}