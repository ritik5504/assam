"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/me', { method: 'POST' });
      setUser(null);
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/products', label: 'Products' },
    { href: '/orders', label: 'Orders' },
  ];

  if (user?.role === 'admin') {
    links.push({ href: '/admin/products', label: 'Admin' });
  }

  const isActive = (href) => pathname === href;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-zinc-900 dark:text-white">
            <span className="h-6 w-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600"></span>
            AssamEdChem
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  isActive(link.href)
                    ? 'text-indigo-650 dark:text-indigo-400'
                    : 'text-zinc-505 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Auth status / actions */}
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"></div>
          ) : user ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  {user.name || user.email}
                </span>
                <span className="text-xs text-zinc-400 capitalize">
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-all duration-200 cursor-pointer"
              >
                Log out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 px-4 py-2 text-sm font-semibold transition-all duration-200"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
