// app/blend/SearchHandler.jsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SearchHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const blend = searchParams.get('blend');
    if (blend) {
      // You can set state or trigger logic here
      console.log('Blend requested:', blend);
    }
  }, [searchParams]);

  return null;
}
