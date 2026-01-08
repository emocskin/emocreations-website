// app/thank-you/page.js
'use client';

import { useState } from 'react';

export default function ThankYou() {
  const [email, setEmail] = useState('');
  const [blend, setBlend] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Send to your backend (e.g., Supabase)
    alert('Order received! We’ll email your blend recipe.');
    window.location.href = '/'; // or stay
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
      <p className="mb-6">Your payment was successful. Please confirm your details:</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-gray-900 border border-gray-800 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Which blend would you like?</label>
          <select 
            value={blend}
            onChange={(e) => setBlend(e.target.value)}
            className="w-full p-3 bg-gray-900 border border-gray-800 rounded"
            required
          >
            <option value="">Select a blend</option>
            <option value="xe">XE – Everybody’s Oil</option>
            <option value="queen">Queen’s Oil</option>
            <option value="unbroken">The Unbroken Ointment</option>
          </select>
        </div>
        <button 
          type="submit"
          className="w-full bg-turquoise text-black py-3 rounded font-medium"
        >
          Confirm Order
        </button>
      </form>
    </div>
  );
}
