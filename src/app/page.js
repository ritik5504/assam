"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error("Failed to load user session:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 font-sans relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl dark:bg-indigo-600/10"></div>
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl dark:bg-violet-600/10"></div>

      <main className="mx-auto max-w-4xl px-6 py-24 text-center z-10 flex flex-col items-center space-y-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/50">
          🧪 Modern Chemical Ordering Platform
        </span>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 via-indigo-950 to-zinc-900 dark:from-white dark:via-indigo-200 dark:to-white bg-clip-text text-transparent leading-none">
          AssamEdChem Portal
        </h1>

        <p className="max-w-xl text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed mx-auto">
          Access high-purity laboratory reagents, chemical supplies, and educational materials. Manage orders, check inventory, and monitor shipments in one secure dashboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center min-h-[48px]">
          <Link
            href="/products"
            className="flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-750 text-white px-8 font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 w-44"
          >
            Explore Catalog
          </Link>
          
          {loading ? (
            <div className="flex h-12 w-44 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-600"></div>
            </div>
          ) : user ? (
            <Link
              href={user.role === 'ADMIN' ? "/dashboard" : "/orders"}
              className="flex h-12 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 px-8 font-semibold text-zinc-700 dark:text-zinc-300 transition-all duration-200 w-44"
            >
              {user.role === 'ADMIN' ? 'Go to Dashboard' : 'My Orders'}
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex h-12 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 px-8 font-semibold text-zinc-700 dark:text-zinc-300 transition-all duration-200 w-44"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Feature Cards Grid */}
        <div className="pt-16 grid grid-cols-1 gap-6 sm:grid-cols-3 w-full">
          {[
            { title: 'Wide Catalog', desc: 'Browse over 1,000+ chemicals with detailed specs and datasheets.', icon: '📚' },
            { title: 'Secure Checkouts', desc: 'Purchase reagents using streamlined payment and order methods.', icon: '🔒' },
            { title: 'Admin Controls', desc: 'Manage stocks, list catalog additions, and cancel/complete orders.', icon: '🎛️' },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 p-6 text-left hover:shadow-md transition-shadow duration-200"
            >
              <span className="text-2xl mb-4 block">{feature.icon}</span>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-base">{feature.title}</h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 leading-normal">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
