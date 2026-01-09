// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    agentActions: 0,
    unlocks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [
        { count: products },
        { count: orders },
        { count: agentActions },
        { count: unlocks }
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('agent_actions').select('*', { count: 'exact', head: true }),
        supabase.from('unlocks').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        products: products || 0,
        orders: orders || 0,
        agentActions: agentActions || 0,
        unlocks: unlocks || 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Products" 
          value={stats.products} 
          href="/dashboard/products" 
        />
        <StatCard 
          title="Orders" 
          value={stats.orders} 
          href="/dashboard/orders" 
        />
        <StatCard 
          title="Agent Actions" 
          value={stats.agentActions} 
          href="/dashboard/agent-actions" 
        />
        <StatCard 
          title="XEC Unlocks" 
          value={stats.unlocks} 
          href="/dashboard/agent-actions" 
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-900 p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link 
            href="/dashboard/products" 
            className="block p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
          >
            <h3 className="font-bold text-turquoise">Manage Products</h3>
            <p className="text-gray-400 text-sm">Add, edit, or delete blends</p>
          </Link>
          <Link 
            href="/dashboard/orders" 
            className="block p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
          >
            <h3 className="font-bold text-turquoise">View Orders</h3>
            <p className="text-gray-400 text-sm">Track PayPal and XEC unlocks</p>
          </Link>
          <Link 
            href="/dashboard/agent-actions" 
            className="block p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
          >
            <h3 className="font-bold text-turquoise">Monitor Rewards</h3>
            <p className="text-gray-400 text-sm">Social shares, free samples, referrals</p>
          </Link>
          <a 
            href="https://xaman.app/developer"
            target="_blank"
            rel="noopener"
            className="block p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
          >
            <h3 className="font-bold text-turquoise">Xaman Payloads</h3>
            <p className="text-gray-400 text-sm">View wallet verification requests</p>
          </a>
        </div>
      </div>

      {/* System Status */}
      <div className="mt-8 bg-gray-900 p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-4">System Status</h2>
        <div className="space-y-3">
          <StatusItem name="Market-Making Bot" status="active" />
          <StatusItem name="Social Monitor Agent" status="active" />
          <StatusItem name="XEC Reward Webhook" status="active" />
          <StatusItem name="Blend Verification" status="active" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, href }: { title: string; value: number; href: string }) {
  return (
    <Link href={href} className="block">
      <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-turquoise transition">
        <p className="text-gray-400">{title}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
      </div>
    </Link>
  );
}

function StatusItem({ name, status }: { name: string; status: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-300">{name}</span>
      <span className={`px-2 py-1 rounded text-xs ${
        status === 'active' 
          ? 'bg-green-900/30 text-green-400' 
          : 'bg-red-900/30 text-red-400'
      }`}>
        {status}
      </span>
    </div>
  );
}
