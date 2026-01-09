// app/dashboard/orders/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Order = {
  id: string;
  email: string;
  blend_slug: string;
  order_id: string | null;
  created_at: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      {loading ? (
        <p className="text-gray-400">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-gray-900 p-4 rounded-xl">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <p className="font-medium">{order.email}</p>
                  <p className="text-gray-400 text-sm">Blend: {order.blend_slug}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                  {order.order_id && (
                    <p className="text-turquoise text-sm">PayPal: {order.order_id}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
