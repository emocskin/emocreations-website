// app/quiz/page.js
'use client';

import { useState } from 'react';
import Link from 'next/link';

const QUIZ = [
  { q: "What’s your primary concern?", options: [
    { label: "Joint or nerve pain", value: "unbroken" },
    { label: "Hormonal balance", value: "menopause" },
    { label: "Daily stress", value: "xe" },
    { label: "Sleep or recovery", value: "queen" }
  ]}
];

export default function PainPointQuiz() {
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);

  const handleSubmit = (e, value) => {
    e.preventDefault();
    setAnswers({ ...answers, [step]: value });
    if (step === QUIZ.length - 1) {
      // Redirect to blend
      window.location.href = `/blend?blend=${value}`;
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Find Your Blend</h1>
      {QUIZ.map((item, i) => i === step && (
        <div key={i}>
          <h2 className="mb-6">{item.q}</h2>
          <div className="space-y-4">
            {item.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={(e) => handleSubmit(e, opt.value)}
                className="w-full text-left p-4 bg-gray-900 rounded-xl border border-gray-800 hover:border-turquoise transition"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
