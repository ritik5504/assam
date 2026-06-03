"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    setMobileMenuOpen(false); // Close mobile menu on route change
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
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/products', label: 'Products', icon: '🧪' },
    { href: '/orders', label: 'Orders', icon: '📦' },
  ];

  if (user?.role === 'ADMIN') {
    links.push({ href: '/admin/products', label: 'Admin Panel', icon: '🎛️' });
  }

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const navItemClass = (href) => {
    const active = isActive(href);
    return `group flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 cursor-pointer ${
      active
        ? 'bg-zinc-200/80 text-zinc-900 border-l-4 border-indigo-600 shadow-sm pl-3 font-bold'
        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 bg-transparent border-l-4 border-transparent'
    }`;
  };

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-zinc-200 bg-white/95 backdrop-blur-md z-40">
        {/* Logo and Header */}
        <div className="flex h-16 items-center px-6 border-b border-zinc-150">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-zinc-900">
            <span className="h-6 w-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex-shrink-0"></span>
            <span>AssamEdChem</span>
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={navItemClass(link.href)}>
              <span className="text-lg opacity-85 group-hover:scale-110 transition-transform duration-200">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Info / Sign Out section at bottom */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50/50">
          {loading ? (
            <div className="h-12 w-full animate-pulse rounded-xl bg-zinc-200"></div>
          ) : user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 uppercase">
                  {user.name ? user.name[0] : user.email[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-zinc-900 truncate leading-snug">
                    {user.name || user.email}
                  </div>
                  <div className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider mt-0.5 leading-none">
                    {user.role}
                  </div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2.5 text-xs font-semibold text-zinc-700 transition-all duration-200 cursor-pointer shadow-sm"
              >
                🚪 Log out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="w-full flex items-center justify-center rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2.5 text-xs font-semibold transition-all duration-200 shadow-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      </aside>

      {/* --- MOBILE TOP NAVIGATION --- */}
      <header className="md:hidden sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-md h-16 flex items-center justify-between px-4">
        {/* Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-zinc-650 hover:bg-zinc-100 transition-colors"
          aria-label="Toggle Menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight text-zinc-900">
          <span className="h-5 w-5 rounded bg-gradient-to-tr from-indigo-500 to-violet-600"></span>
          <span>AssamEdChem</span>
        </Link>

        {/* User avatar display */}
        <div className="w-10 flex justify-end">
          {user && (
            <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xs uppercase">
              {user.name ? user.name[0] : user.email[0]}
            </div>
          )}
        </div>

        {/* Mobile Drawer Backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 top-16 bg-zinc-900/20 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Drawer Menu */}
        <div
          className={`fixed top-16 bottom-0 left-0 w-64 bg-white border-r border-zinc-200 shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-0 -translate-x-full'
          }`}
        >
          {/* Navigation Links */}
          <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={navItemClass(link.href)}>
                <span className="text-lg">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Sign out area */}
          <div className="p-4 border-t border-zinc-200 bg-zinc-50/50">
            {loading ? (
              <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-200"></div>
            ) : user ? (
              <div className="space-y-3">
                <div className="px-2">
                  <div className="text-sm font-semibold text-zinc-900 truncate">
                    {user.name || user.email}
                  </div>
                  <div className="text-[10px] text-zinc-400 capitalize mt-0.5">
                    {user.role}
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2 text-xs font-semibold text-zinc-700 transition-all duration-200 cursor-pointer"
                >
                  🚪 Log out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="w-full flex items-center justify-center rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 text-xs font-semibold transition-all duration-200"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
