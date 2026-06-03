"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OrderTable from '@/components/OrderTable';

export default function OrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

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
        console.error("Session verification failed:", err);
        router.push('/login');
      } finally {
        setSessionLoading(false);
      }
    };
    checkSession();
  }, [router]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setMessage({ text: 'Order status updated successfully!', type: 'success' });
        fetchOrders();
      } else {
        const errData = await response.json();
        setMessage({ text: errData.error || 'Failed to update order', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Error sending update request.', type: 'error' });
    }
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  if (sessionLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 flex-1 w-full animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Orders</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Manage and track your recent orders.
        </p>
      </div>

      {message.text && (
        <div
          className={`rounded-xl border p-4 text-sm transition-all duration-300 ${
            message.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20'
              : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20'
          }`}
        >
          {message.text}
        </div>
      )}

      <OrderTable
        orders={orders}
        onUpdateStatus={user.role === 'ADMIN' ? handleUpdateStatus : undefined}
      />
    </div>
  );
}
