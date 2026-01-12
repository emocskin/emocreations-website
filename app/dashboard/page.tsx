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

      {/* P&L Summary Widget */}
      <div className="mt-8 bg-gray-900 p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-4">Profit & Loss (Last 30 Days)</h2>
        <PnLWidget />
      </div>

      {/* Xaman Live Payloads Widget */}
      <div className="mt-8 bg-gray-900 p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-4">Live Xaman Payloads</h2>
        <XamanPayloadWidget />
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gray-900 p-6 rounded-2xl">
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

// === Reusable Components ===

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

// === P&L Widget ===
async function fetchPnLSummary() {
  const res = await fetch('/api/pnl-summary');
  if (!res.ok) throw new Error('Failed to fetch P&L');
  return res.json();
}

function PnLWidget() {
  const [pnl, setPnl] = useState({ revenue: 0, expenses: 0, profit: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPnL = async () => {
      try {
        const data = await fetchPnLSummary();
        setPnl(data);
      } catch (e) {
        console.error('P&L fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    loadPnL();
    const interval = setInterval(loadPnL, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <p className="text-gray-400">Loading P&L...</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-gray-800 p-4 rounded-lg">
        <p className="text-gray-400 text-sm">Revenue</p>
        <p className="text-green-400 font-bold">${pnl.revenue.toFixed(2)}</p>
      </div>
      <div className="bg-gray-800 p-4 rounded-lg">
        <p className="text-gray-400 text-sm">Expenses</p>
        <p className="text-red-400 font-bold">${pnl.expenses.toFixed(2)}</p>
      </div>
      <div className="bg-gray-800 p-4 rounded-lg">
        <p className="text-gray-400 text-sm">Profit</p>
        <p className={`font-bold ${pnl.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          ${pnl.profit.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

// === Xaman Payload Widget ===
async function fetchXamanPayloads() {
  const res = await fetch('/api/xaman-payloads');
  if (!res.ok) throw new Error('Failed to fetch payloads');
  const data = await res.json();
  return data.slice(0, 5).sort((a: any, b: any) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function XamanPayloadWidget() {
  const [payloads, setPayloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayloads = async () => {
      try {
        const data = await fetchXamanPayloads();
        setPayloads(data);
      } catch (e) {
        console.error('Payload fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPayloads();
    const interval = setInterval(fetchPayloads, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    if (status === 'signed') return 'text-green-400';
    if (status === 'expired') return 'text-red-400';
    return 'text-yellow-400';
  };

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {loading ? (
        <p className="text-gray-400">Loading payloads...</p>
      ) : payloads.length === 0 ? (
        <p className="text-gray-500">No recent payloads</p>
      ) : (
        payloads.map((p) => {
          const status = p.meta?.blob?.status || 'pending';
          const account = p.response?.account || '—';
          return (
            <div key={p.uuid} className="bg-gray-800 p-3 rounded-lg text-sm">
              <div className="flex justify-between">
                <span className={`font-mono ${getStatusColor(status)}`}>
                  {status}
                </span>
                <span className="text-gray-400">
                  {new Date(p.created_at).toLocaleTimeString()}
                </span>
              </div>
              <p className="font-mono text-white truncate mt-1">{p.uuid}</p>
              <p className="text-gray-300 text-xs mt-1">Account: {account}</p>
            </div>
          );
        })
      )}
    </div>
  );
}
