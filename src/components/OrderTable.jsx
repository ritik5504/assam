import React from 'react';
import { formatCurrency, formatDate, convertFromBase } from '../lib/conversions';
import Link from 'next/link';

export default function OrderTable({ orders, onUpdateStatus }) {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50';
      case 'approved':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50';
      case 'cancelled':
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50';
      default:
        return 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800';
    }
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center text-zinc-400 dark:text-zinc-500">
        No orders found.
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile / Tablet Card View (below md) ── */}
      <div className="md:hidden space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-3 shadow-sm"
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  href={`/orders/${order.id}`}
                  className="font-mono text-xs font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
                >
                  #{order.id.slice(0, 8)}...
                </Link>
                <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
                  {order.user?.name || 'Guest User'}
                </div>
                <div className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                  {order.user?.email}
                </div>
              </div>
              <span
                className={`flex-shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusColor(order.status)}`}
              >
                {order.status}
              </span>
            </div>

            {/* Items */}
            {order.items && order.items.length > 0 && (
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-3 space-y-1">
                {order.items.map((item) => {
                  let displayQty = parseFloat(item.quantity);
                  try { displayQty = convertFromBase(displayQty, item.unit); } catch (_) {}
                  return (
                    <div key={item.id} className="text-xs text-zinc-600 dark:text-zinc-400 flex justify-between">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">
                        {item.product?.name || 'Chemical Product'}
                      </span>
                      <span className="ml-2 flex-shrink-0 text-zinc-500">{displayQty} {item.unit}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer row */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-zinc-400 dark:text-zinc-500">{formatDate(order.createdAt)}</span>
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-50">{formatCurrency(order.totalAmount)}</span>
            </div>

            {/* Admin actions */}
            {onUpdateStatus && (
              <div className="flex items-center gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                {order.status?.toLowerCase() === 'pending' && (
                  <>
                    <button
                      onClick={() => onUpdateStatus(order.id, 'APPROVED')}
                      className="flex-1 text-xs font-semibold text-emerald-700 py-1.5 rounded-xl border border-emerald-200 hover:bg-emerald-50 transition-all duration-150 cursor-pointer"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onUpdateStatus(order.id, 'REJECTED')}
                      className="flex-1 text-xs font-semibold text-rose-700 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 transition-all duration-150 cursor-pointer"
                    >
                      Reject
                    </button>
                  </>
                )}
                {order.status?.toLowerCase() === 'approved' && (
                  <>
                    <button
                      onClick={() => onUpdateStatus(order.id, 'COMPLETED')}
                      className="flex-1 text-xs font-semibold text-indigo-700 py-1.5 rounded-xl border border-indigo-200 hover:bg-indigo-50 transition-all duration-150 cursor-pointer"
                    >
                      Mark Completed
                    </button>
                    <button
                      onClick={() => onUpdateStatus(order.id, 'REJECTED')}
                      className="flex-1 text-xs font-semibold text-rose-700 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 transition-all duration-150 cursor-pointer"
                    >
                      Reject
                    </button>
                  </>
                )}
                {['completed', 'rejected', 'cancelled'].includes(order.status?.toLowerCase()) && (
                  <span className="text-xs text-zinc-400 italic font-medium">Lifecycle Finalized</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Desktop Table View (md+) ── */}
      <div className="hidden md:block w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Items / Details</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Total</th>
                {onUpdateStatus && <th className="px-6 py-4 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors duration-150"
                >
                  <td className="px-6 py-4 font-mono text-xs">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-indigo-600 hover:text-indigo-500 font-semibold hover:underline cursor-pointer"
                    >
                      {order.id.slice(0, 8)}...
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {order.user?.name || 'Guest User'}
                    </div>
                    <div className="text-xs text-zinc-400 dark:text-zinc-500">
                      {order.user?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item) => {
                          let displayQty = parseFloat(item.quantity);
                          try { displayQty = convertFromBase(displayQty, item.unit); } catch (_) {}
                          return (
                            <div key={item.id} className="text-xs text-zinc-600 dark:text-zinc-400">
                              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                {item.product?.name || 'Chemical Product'}
                              </span>
                              {item.product?.sku && (
                                <span className="text-zinc-400 dark:text-zinc-500 font-mono text-[10px] ml-1 bg-zinc-50 dark:bg-zinc-900 px-1 py-0.5 rounded border border-zinc-150 dark:border-zinc-800">
                                  {item.product.sku}
                                </span>
                              )}
                              <span> - {displayQty} {item.unit}</span>
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-xs text-zinc-400 italic">No items</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusColor(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {formatCurrency(order.totalAmount)}
                    </div>
                  </td>
                  {onUpdateStatus && (
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {order.status?.toLowerCase() === 'pending' && (
                          <>
                            <button
                              onClick={() => onUpdateStatus(order.id, 'APPROVED')}
                              className="text-xs font-semibold text-emerald-700 hover:text-emerald-500 dark:text-emerald-400 cursor-pointer px-2.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/35 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all duration-150"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => onUpdateStatus(order.id, 'REJECTED')}
                              className="text-xs font-semibold text-rose-700 hover:text-rose-500 dark:text-rose-400 cursor-pointer px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/35 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all duration-150"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {order.status?.toLowerCase() === 'approved' && (
                          <>
                            <button
                              onClick={() => onUpdateStatus(order.id, 'COMPLETED')}
                              className="text-xs font-semibold text-indigo-700 hover:text-indigo-500 dark:text-indigo-400 cursor-pointer px-2.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900/35 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all duration-150"
                            >
                              Mark as Completed
                            </button>
                            <button
                              onClick={() => onUpdateStatus(order.id, 'REJECTED')}
                              className="text-xs font-semibold text-rose-700 hover:text-rose-500 dark:text-rose-400 cursor-pointer px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/35 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all duration-150"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {['completed', 'rejected', 'cancelled'].includes(order.status?.toLowerCase()) && (
                          <span className="text-xs text-zinc-400 dark:text-zinc-550 italic font-medium">Finalized</span>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
