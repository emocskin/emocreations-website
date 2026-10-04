import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 1. Environment Variable Validation (Fail fast on startup)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("❌ Missing Supabase environment variables. Please check your .env.local file.");
}

// Initialize Supabase (Uses Service Role Key to bypass RLS for backend operations)
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. ReDoS-immune validations
const isValidUUID = (uuid: unknown): uuid is string => {
  return typeof uuid === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
};

const isValidEmail = (email: unknown): email is string => {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// 3. Next.js POST Route Handler
export async function POST(request: NextRequest) {
  try {
    // Next.js parses the body natively (will throw if invalid JSON, caught by outer catch)
    const body = await request.json();
    const { orderId, email, wellnessGoal, additionalNotes } = body;

    // Strict Runtime Input Validation
    if (!orderId || !email || !wellnessGoal) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    if (!isValidUUID(orderId)) {
      return NextResponse.json({ error: "Invalid Order ID format." }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
    }
    if (typeof wellnessGoal !== "string" || wellnessGoal.trim() === "") {
      return NextResponse.json({ error: "Invalid wellness goal." }, { status: 400 });
    }

    // Security Check: Ensure order exists and is actually paid
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Allow both 'paid' and 'processing' (in case of a frontend retry)
    if (order.status !== "paid" && order.status !== "processing") {
      return NextResponse.json({ error: `Order is not valid or not paid. Current status: ${order.status}` }, { status: 400 });
    }

    // Update Database with Customer Preferences
    // Explicitly guarantee 'notes' is a clean string, preventing JSONB type pollution
    const cleanNotes = typeof additionalNotes === "string" ? additionalNotes.trim() : "";

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "processing",
        email: email, 
        blend_preferences: {
          goal: wellnessGoal.trim(),
          notes: cleanNotes, 
        },
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("❌ Database update error:", updateError);
      throw new Error("Failed to update order in database.");
    }

    // Trigger External Services (AI Agent & Email)
    // If these fail, the order remains "processing" and can be retried later.
    try {
      await triggerAiBlendingAgent(orderId, wellnessGoal.trim(), cleanNotes);
      await sendOrderConfirmationEmail(email, orderId);
    } catch (externalError: unknown) {
      console.error("⚠️ External service failed, but order is saved as 'processing':", externalError);
      // We still return 200 to the user because their payment and preferences are safely saved.
    }

    return NextResponse.json({ 
      success: true, 
      message: "Order finalized and AI agent triggered." 
    }, { status: 200 });

  } catch (error: unknown) {
    console.error("❌ Critical error finalizing order:", error);
    
    // Handle invalid JSON specifically, otherwise generic 500
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }
    
    const errorMessage = error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// ==========================================
// INTEGRATION MOCKS
// ==========================================
async function triggerAiBlendingAgent(orderId: string, goal: string, notes: string) {
  console.log(`🤖 AI Agent triggered for Order ${orderId}: Goal=${goal}, Notes=${notes}`);
  // TODO: Replace with your actual AI webhook call
}

async function sendOrderConfirmationEmail(email: string, orderId: string) {
  console.log(`📧 Confirmation email sent to ${email} for Order ${orderId}`);
  // TODO: Replace with your actual email service call (e.g., Resend, SendGrid)
}