// app/dashboard/layout.tsx
import { ReactNode } from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Simple auth: check for DASHBOARD_TOKEN cookie
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const cookieStore = cookies();
  const token = cookieStore.get('DASHBOARD_TOKEN')?.value;

  // Replace with your secret token
  if (token !== process.env.DASHBOARD_TOKEN) {
    redirect('/dashboard/login');
  }

  return (
    <div className="flex bg-black text-white min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 p-6">
        <h1 className="text-xl font-bold mb-8 text-turquoise">EmoCreations Admin</h1>
        <nav className="space-y-4">
          <Link href="/dashboard" className="block py-2 px-4 hover:bg-gray-800 rounded">Overview</Link>
          <Link href="/dashboard/products" className="block py-2 px-4 hover:bg-gray-800 rounded">Products</Link>
          <Link href="/dashboard/orders" className="block py-2 px-4 hover:bg-gray-800 rounded">Orders</Link>
          <Link href="/dashboard/agent-actions" className="block py-2 px-4 hover:bg-gray-800 rounded">Agent Logs</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
