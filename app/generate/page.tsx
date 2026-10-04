import BlendGenerator from "@/components/BlendGenerator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Blend Generator | Emocreations.skin",
  description: "Create personalized essential oil blends powered by AI.",
};

export default function GeneratePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            AI Blend Generator
          </h1>
          <p className="text-gray-600">
            Describe your symptoms or wellness goals for a custom recipe.
          </p>
        </div>
        
        <BlendGenerator />
      </div>
    </main>
  );
}