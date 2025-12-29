// app/blend/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BlendAccessPage() {
  const [accessGranted, setAccessGranted] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user has already paid (via cookie, session, or localStorage)
    const hasAccess = localStorage.getItem('blend_access_granted');
    if (hasAccess) {
      setAccessGranted(true);
      setChecking(false);
      return;
    }

    // Optionally: check if XEC-qualified via API
    // If not, show payment options
    setChecking(false);
  }, []);

  const handlePayPalSuccess = () => {
    localStorage.setItem('blend_access_granted', 'true');
    setAccessGranted(true);
  };

  const handleXecUnlock = async () => {
    // Call /api/verify-xec, if success:
    localStorage.setItem('blend_access_granted', 'true');
    setAccessGranted(true);
  };

  if (checking) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Checking access...</div>;
  }

  if (accessGranted) {
    // Redirect to your custom AI form OR Poe with auth
    router.push('/blend/app'); // your own AI interface
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white py-16 px-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Unlock the AI Blending App</h1>
      <p className="text-gray-400 mb-8">
        Access our AI-powered wellness assistant. Create personalized, science-backed essential oil blends.
      </p>

      {/* XEC & PayPal options here */}
      <button onClick={handleXecUnlock} className="w-full bg-turquoise text-black py-3 rounded mb-4">
        Unlock with XEC
      </button>
      
      <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
        <input type="hidden" name="cmd" value="_s-xclick" />
        <input type="hidden" name="hosted_button_id" value="UZDG2HL3BMSUW" />
        <input
          type="image"
          src="https://www.paypalobjects.com/en_US/i/btn/btn_buynow_LG.gif"
          name="submit"
          alt="PayPal"
          className="w-full max-w-xs mx-auto"
        />
      </form>
    </div>
  );
}
