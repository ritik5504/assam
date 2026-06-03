"use client";

import React, { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import { formatCurrency, convertToBase, getDisplayValues } from '@/lib/conversions';

export default function ProductsPage() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddToCart = (product) => {
    const display = getDisplayValues(product.stockQuantity, product.basePrice, product.baseUnit);
    const defaultUnit = display.displayUnit;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id && item.unit === defaultUnit);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id && item.unit === defaultUnit
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1, unit: defaultUnit }];
    });
    showToast(`Added ${product.name} to cart!`, 'success');
  };

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  // Helper to get allowed units for a product
  const getAllowedUnits = (baseUnit) => {
    if (baseUnit === 'g') return ['g', 'kg'];
    if (baseUnit === 'mL') return ['mL', 'L'];
    return ['item'];
  };

  // Calculate price for a cart item based on its selected quantity and unit
  const getCartItemCost = (item) => {
    try {
      const base = convertToBase(parseFloat(item.quantity) || 0, item.unit);
      return base.quantity * parseFloat(item.product.basePrice);
    } catch (err) {
      return 0;
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + getCartItemCost(item), 0);

  const handleUpdateCartItemQty = (productId, unit, val) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId && item.unit === unit
          ? { ...item, quantity: parseFloat(val) || 0 }
          : item
      )
    );
  };

  const handleUpdateCartItemUnit = (productId, oldUnit, newUnit) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId && item.unit === oldUnit
          ? { ...item, unit: newUnit }
          : item
      )
    );
  };

  const handleRemoveCartItem = (productId, unit) => {
    setCart((prev) => prev.filter((item) => !(item.product.id === productId && item.unit === unit)));
  };

  const handleCheckout = async () => {
    if (!user) {
      showToast('Please sign in to place an order.', 'error');
      return;
    }
    if (cart.length === 0) return;

    setCheckingOut(true);
    try {
      // Map and convert ordered items to database base units (g, mL, item)
      const orderItems = cart.map(item => {
        const base = convertToBase(parseFloat(item.quantity), item.unit);
        return {
          productId: item.product.id,
          quantity: base.quantity,
          price: parseFloat(item.product.basePrice), // price per base unit
        };
      });

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: orderItems,
          totalAmount: cartTotal,
        }),
      });

      if (response.ok) {
        showToast('Order placed successfully!', 'success');
        setCart([]);
        fetchProducts();
      } else {
        const errData = await response.json();
        showToast(errData.error || 'Failed to place order', 'error');
      }
    } catch (error) {
      showToast('Error sending checkout request.', 'error');
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 w-full flex flex-col md:flex-row gap-8 animate-fade-in">
      {/* Products Grid */}
      <div className="flex-1 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Chemical Products</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Browse our catalog of premium laboratory chemicals and reagents.
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

        {products.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center text-zinc-400">
            No products available at the moment.
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      <div className="w-full md:w-[360px] flex-shrink-0">
        <div className="sticky top-24 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center justify-between">
            Shopping Cart
            {cart.length > 0 && (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 text-xs font-semibold">
                {cart.length}
              </span>
            )}
          </h2>

          {cart.length > 0 ? (
            <div className="space-y-4">
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 overflow-y-auto max-h-[340px] pr-1">
                {cart.map((item, idx) => {
                  const allowedUnits = getAllowedUnits(item.product.baseUnit);
                  const displayInfo = getDisplayValues(1, item.product.basePrice, item.product.baseUnit); // get unit price factor
                  // Determine price per currently selected unit
                  const unitPrice = parseFloat(item.product.basePrice) * (convertToBase(1, item.unit).quantity);

                  return (
                    <div key={idx} className="py-4 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-white leading-tight">{item.product.name}</p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-550 mt-1">
                            {formatCurrency(unitPrice)} / {item.unit}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveCartItem(item.product.id, item.unit)}
                          className="text-xs text-rose-500 hover:text-rose-650 cursor-pointer font-medium"
                        >
                          Remove
                        </button>
                      </div>
                      
                      {/* Qty and Unit Selectors */}
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={item.quantity}
                          onChange={(e) => handleUpdateCartItemQty(item.product.id, item.unit, e.target.value)}
                          className="w-20 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                        />
                        {allowedUnits.length > 1 ? (
                          <select
                            value={item.unit}
                            onChange={(e) => handleUpdateCartItemUnit(item.product.id, item.unit, e.target.value)}
                            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2 py-1 text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            {allowedUnits.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-zinc-400 font-medium px-1 capitalize">{item.unit}</span>
                        )}
                        <span className="ml-auto font-bold text-zinc-900 dark:text-zinc-50 text-sm">
                          {formatCurrency(getCartItemCost(item))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 flex items-center justify-between text-base font-bold text-zinc-900 dark:text-white">
                <span>Total</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {checkingOut ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  'Place Order'
                )}
              </button>
            </div>
          ) : (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 py-6 text-center">
              Your cart is empty. Add products to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
