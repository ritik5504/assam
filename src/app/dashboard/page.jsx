"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OrderTable from '@/components/OrderTable';
import { formatCurrency } from '@/lib/conversions';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    approvedOrders: 0,
    rejectedOrders: 0,
    revenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!data.user) {
          router.push('/login');
        } else {
          setUser(data.user);
        }
      } catch (err) {
        console.error("Session check failed:", err);
        router.push('/login');
      } finally {
        setSessionLoading(false);
      }
    };
    checkSession();
  }, [router]);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          const ordersRes = await fetch('/api/orders');
          const productsRes = await fetch('/api/products');
          
          const orders = await ordersRes.json();
          const products = await productsRes.json();

          const totalProducts = products.length;
          const totalOrders = orders.length;
          const pendingOrders = orders.filter(o => o.status?.toUpperCase() === 'PENDING').length;
          const approvedOrders = orders.filter(o => o.status?.toUpperCase() === 'APPROVED').length;
          const rejectedOrders = orders.filter(o => ['REJECTED', 'CANCELLED'].includes(o.status?.toUpperCase())).length;
          const revenue = orders
            .filter(o => o.status?.toUpperCase() === 'COMPLETED')
            .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

          setStats({
            totalProducts,
            totalOrders,
            pendingOrders,
            approvedOrders,
            rejectedOrders,
            revenue,
          });
          setRecentOrders(orders.slice(0, 5));
        } catch (error) {
          console.error("Failed to fetch dashboard data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [user]);

  if (sessionLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 flex-1 w-full animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Dashboard</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Welcome back, <span className="font-semibold text-zinc-800 dark:text-zinc-200">{user.name || user.email}</span>. Here's what's happening today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: 'Total Revenue', value: formatCurrency(stats.revenue), icon: '💰', color: 'from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/5 dark:to-transparent' },
          { label: 'Total Products', value: stats.totalProducts, icon: '🧪', color: 'from-violet-500/10 to-violet-600/5 dark:from-violet-500/5 dark:to-transparent' },
          { label: 'Total Orders', value: stats.totalOrders, icon: '📦', color: 'from-indigo-500/10 to-indigo-600/5 dark:from-indigo-500/5 dark:to-transparent' },
          { label: 'Pending Orders', value: stats.pendingOrders, icon: '⏳', color: 'from-amber-500/10 to-amber-600/5 dark:from-amber-500/5 dark:to-transparent' },
          { label: 'Approved Orders', value: stats.approvedOrders, icon: '✅', color: 'from-blue-500/10 to-blue-600/5 dark:from-blue-500/5 dark:to-transparent' },
          { label: 'Rejected Orders', value: stats.rejectedOrders, icon: '❌', color: 'from-rose-500/10 to-rose-600/5 dark:from-rose-500/5 dark:to-transparent' },
        ].map((card, idx) => (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 flex items-center justify-between shadow-sm bg-gradient-to-br ${card.color}`}
          >
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{card.label}</p>
              <h4 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-55">{card.value}</h4>
            </div>
            <span className="text-3xl">{card.icon}</span>
          </div>
        ))}
      </div>

      {/* Recent Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Recent Orders</h2>
          <Link href="/orders" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
            View all orders →
          </Link>
        </div>
        <OrderTable orders={recentOrders} />
      </div>
    </div>
  );
}
