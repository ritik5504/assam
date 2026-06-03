"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { formatCurrency, formatDate, convertFromBase, convertToBase } from '@/lib/conversions';
import Link from 'next/link';

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id;

  const [user, setUser] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [actionLoading, setActionLoading] = useState(false);

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

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        setMessage({ text: 'Failed to load order details.', type: 'error' });
      }
    } catch (err) {
      console.error("Failed to load order details:", err);
      setMessage({ text: 'Error loading order details.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && orderId) {
      fetchOrder();
    }
  }, [user, orderId]);

  const handleUpdateStatus = async (newStatus) => {
    setActionLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setMessage({ text: `Order status updated to ${newStatus} successfully!`, type: 'success' });
        await fetchOrder();
      } else {
        const errData = await response.json();
        setMessage({ text: errData.error || 'Failed to update order status.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Error sending update request.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-250';
      case 'approved':
        return 'bg-blue-50 text-blue-700 border-blue-250';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-250';
      case 'cancelled':
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-250';
      default:
        return 'bg-zinc-50 text-zinc-700 border-zinc-250';
    }
  };

  if (sessionLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user || !order) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center space-y-4">
        <p className="text-zinc-500">{message.text || 'Order not found.'}</p>
        <Link href="/orders" className="inline-flex items-center text-sm font-semibold text-indigo-650 hover:text-indigo-505 transition-colors">
          ← Back to Orders
        </Link>
      </div>
    );
  }

  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 flex-1 w-full animate-fade-in text-zinc-800">
      {/* Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href={isAdmin ? "/dashboard" : "/orders"} className="inline-flex items-center text-xs font-semibold text-zinc-500 hover:text-indigo-650 transition-colors mb-2">
            ← Back to {isAdmin ? 'Dashboard' : 'My Orders'}
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Order Details <span className="font-mono text-zinc-400 text-lg font-normal">#{order.id.slice(0, 8)}</span>
          </h1>
        </div>
        
        {/* Status Badge */}
        <div>
          <span className={`inline-flex items-center rounded-full border px-3.5 py-1 text-xs font-semibold capitalize ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div className={`rounded-xl border p-4 text-sm transition-all duration-300 ${
          message.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-rose-200 bg-rose-50 text-rose-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Metadata Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer info */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Customer Info</h3>
          <div>
            <div className="font-bold text-zinc-900 text-base">{order.user?.name || 'Guest Customer'}</div>
            <div className="text-xs text-zinc-500 font-mono mt-1">{order.user?.email || 'No email associated'}</div>
          </div>
        </div>

        {/* Date and values */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Order Metadata</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-zinc-450 block">Order Date</span>
              <span className="text-sm font-semibold text-zinc-800 mt-0.5 block">{formatDate(order.createdAt)}</span>
            </div>
            <div>
              <span className="text-xs text-zinc-450 block">Total Amount</span>
              <span className="text-sm font-bold text-zinc-900 mt-0.5 block">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* System logs identifier */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">System Logs</h3>
          <div>
            <div className="text-xs text-zinc-450 block">Unique ID</div>
            <div className="text-xs font-mono text-zinc-500 mt-0.5 select-all break-all">{order.id}</div>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-150 bg-zinc-50/50">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-650">Ordered Products & Conversions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4 text-center">Ordered Qty</th>
                <th className="px-6 py-4 text-center text-indigo-650 bg-indigo-50/20">Converted Quantity</th>
                <th className="px-6 py-4 text-right">Unit Price</th>
                <th className="px-6 py-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {order.items?.map((item) => {
                let displayQty = parseFloat(item.quantity);
                try {
                  displayQty = convertFromBase(displayQty, item.unit);
                } catch (e) {
                  console.error(e);
                }

                const displayUnitFactor = convertToBase(1, item.unit).quantity;
                const unitPrice = parseFloat(item.price) * displayUnitFactor;

                return (
                  <tr key={item.id} className="hover:bg-zinc-50/25 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-zinc-900">{item.product?.name || 'Chemical Compound'}</div>
                      {item.product?.sku && (
                        <div className="text-[10px] font-mono text-zinc-400 mt-0.5">{item.product.sku}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-zinc-800">
                      {displayQty} {item.unit}
                    </td>
                    <td className="px-6 py-4 text-center text-indigo-650 font-bold bg-indigo-50/10 font-mono">
                      {parseFloat(item.quantity)} {item.product?.baseUnit || 'g'}
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-500">
                      {formatCurrency(unitPrice)} <span className="text-[10px] font-normal">/ {item.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-zinc-950">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin actions block */}
      {isAdmin && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Admin Control Console</h2>
              <p className="text-xs text-zinc-500 mt-1">Review this order and adjust its lifecycle state. Inventory stock is decremented upon approval.</p>
            </div>
            
            <div className="flex items-center gap-2">
              {order.status?.toLowerCase() === 'pending' && (
                <>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus('APPROVED')}
                    className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer px-4 py-2.5 rounded-xl hover:shadow-lg disabled:opacity-50 transition-all duration-150"
                  >
                    Approve Order
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus('REJECTED')}
                    className="text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer px-4 py-2.5 rounded-xl disabled:opacity-50 transition-all duration-150"
                  >
                    Reject Order
                  </button>
                </>
              )}
              {order.status?.toLowerCase() === 'approved' && (
                <>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus('COMPLETED')}
                    className="text-xs font-semibold text-white bg-emerald-650 hover:bg-emerald-700 cursor-pointer px-4 py-2.5 rounded-xl hover:shadow-lg disabled:opacity-50 transition-all duration-150"
                  >
                    Mark as Completed
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus('REJECTED')}
                    className="text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer px-4 py-2.5 rounded-xl disabled:opacity-50 transition-all duration-150"
                  >
                    Reject Order
                  </button>
                </>
              )}
              {['completed', 'rejected', 'cancelled'].includes(order.status?.toLowerCase()) && (
                <span className="text-xs text-zinc-400 italic font-semibold border border-zinc-200 bg-zinc-50 px-3 py-1.5 rounded-lg select-none">
                  Lifecycle Finalized
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
