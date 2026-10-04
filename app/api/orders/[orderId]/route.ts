import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 1. Environment Variable Validation (Fail fast on startup)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("❌ Missing Supabase environment variables. Please check your .env.local file.");
}

// Initialize Supabase (Uses Service Role Key to bypass RLS for backend operations)
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. ReDoS-immune validation
const isValidUUID = (uuid: unknown): uuid is string => {
  return typeof uuid === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
};

// 3. Next.js GET Route Handler
export async function GET(
  // Note: 'request' removed to prevent ESLint no-unused-vars warnings, 
  // as we only need the dynamic route params for this endpoint.
  { params }: { params: Promise<{ orderId: string }> } // 👈 Next.js 15+ syntax
) {
  // CRITICAL FIX: Await the params object (Next.js 15+)
  const { orderId } = await params;

  if (!isValidUUID(orderId)) {
    return NextResponse.json({ error: "Invalid Order ID format." }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("id, status, xec_amount, email, blend_preferences, blend_recipe, created_at")
      .eq("id", orderId)
      .single();

    // Supabase returns an error object if 0 rows are found for .single()
    if (error || !data) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: unknown) {
    console.error("❌ Error fetching order:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}