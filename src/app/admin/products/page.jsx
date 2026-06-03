"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency, convertToBase, getDisplayValues, formatINR } from '@/lib/conversions';

export default function AdminProductsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('add-product');
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Add Product form states (user-facing inputs)
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [dimension, setDimension] = useState('Solid');
  const [inputPrice, setInputPrice] = useState('');
  const [inputStock, setInputStock] = useState('');
  const [inputUnit, setInputUnit] = useState('g');
  const [image, setImage] = useState('');
  
  // Edit Product states
  const [editingProduct, setEditingProduct] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editDimension, setEditDimension] = useState('Solid');
  const [editInputPrice, setEditInputPrice] = useState('');
  const [editInputStock, setEditInputStock] = useState('');
  const [editInputUnit, setEditInputUnit] = useState('g');
  const [editImage, setEditImage] = useState('');

  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!data.user) {
          router.push('/login');
        } else if (data.user.role !== 'ADMIN') {
          router.push('/dashboard');
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

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'manage-products' && user) {
      fetchProducts();
    }
  }, [activeTab, user]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Convert user inputs to database base units (g, mL, item)
      const base = convertToBase(parseFloat(inputStock), inputUnit);
      const factor = base.quantity / parseFloat(inputStock);
      const basePriceVal = parseFloat(inputPrice) / factor;

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          sku,
          dimension,
          basePrice: basePriceVal,
          stockQuantity: base.quantity,
          baseUnit: base.unit,
          image,
        }),
      });

      if (response.ok) {
        setMessage({ text: 'Product added successfully!', type: 'success' });
        setName('');
        setDescription('');
        setSku('');
        setDimension('Solid');
        setInputPrice('');
        setInputStock('');
        setInputUnit('g');
        setImage('');
      } else {
        const data = await response.json();
        setMessage({ text: data.error || 'Failed to add product', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'An error occurred. Please try again.', type: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleStartEdit = (product) => {
    // Convert base values from database to friendly display values for editing
    const display = getDisplayValues(product.stockQuantity, product.basePrice, product.baseUnit);
    
    setEditingProduct(product);
    setEditName(product.name);
    setEditDescription(product.description || '');
    setEditSku(product.sku || '');
    setEditDimension(product.dimension || 'Solid');
    setEditInputPrice(display.displayPrice.toString());
    setEditInputStock(display.displayQuantity.toString());
    setEditInputUnit(display.displayUnit);
    setEditImage(product.image || '');
    setActiveTab('edit-product');
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    setFormLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Convert user edits back to database base units (g, mL, item)
      const base = convertToBase(parseFloat(editInputStock), editInputUnit);
      const factor = base.quantity / parseFloat(editInputStock);
      const basePriceVal = parseFloat(editInputPrice) / factor;

      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProduct.id,
          name: editName,
          description: editDescription,
          sku: editSku,
          dimension: editDimension,
          basePrice: basePriceVal,
          stockQuantity: base.quantity,
          baseUnit: base.unit,
          image: editImage,
        }),
      });

      if (response.ok) {
        setMessage({ text: 'Product updated successfully!', type: 'success' });
        setEditingProduct(null);
        setActiveTab('manage-products');
      } else {
        const data = await response.json();
        setMessage({ text: data.error || 'Failed to update product', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'An error occurred. Please try again.', type: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMessage({ text: 'Product deleted successfully!', type: 'success' });
        fetchProducts();
      } else {
        const data = await res.json();
        setMessage({ text: data.error || 'Failed to delete product', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Error deleting product', type: 'error' });
    }
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  if (sessionLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 flex-1 w-full animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Products Inventory</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Create, update, and manage chemical inventory catalog with unit conversions.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              setActiveTab('add-product');
              setEditingProduct(null);
            }}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-all duration-150 cursor-pointer ${
              activeTab === 'add-product'
                ? 'border-indigo-500 text-indigo-650 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-300'
            }`}
          >
            Add Chemical
          </button>
          <button
            onClick={() => {
              setActiveTab('manage-products');
              setEditingProduct(null);
            }}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-all duration-150 cursor-pointer ${
              activeTab === 'manage-products'
                ? 'border-indigo-500 text-indigo-650 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-300'
            }`}
          >
            Manage Inventory
          </button>
          {editingProduct && (
            <button
              onClick={() => setActiveTab('edit-product')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-all duration-150 cursor-pointer ${
                activeTab === 'edit-product'
                  ? 'border-indigo-500 text-indigo-650 dark:text-indigo-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-750 dark:text-zinc-400'
              }`}
            >
              Edit: {editingProduct.name}
            </button>
          )}
        </nav>
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

      {/* Tab Content */}
      {activeTab === 'add-product' && (
        <div className="max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm animate-fade-in">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Create New Chemical Product</h2>
          <form onSubmit={handleAddProduct} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Chemical Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Hydrochloric Acid 37%"
                  className="mt-1 block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all duration-200"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., ACS Reagent grade chemical suitable for analysis..."
                  rows={4}
                  className="mt-1 block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">SKU Code</label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. CHEM-HCL-37"
                  className="mt-1 block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Dimension / Physical State</label>
                <select
                  required
                  value={dimension}
                  onChange={(e) => setDimension(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all duration-200 cursor-pointer"
                >
                  <option value="Solid">Solid</option>
                  <option value="Liquid">Liquid</option>
                  <option value="Gas">Gas</option>
                  <option value="Other">Other / Solid Mix</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Input Unit</label>
                <select
                  required
                  value={inputUnit}
                  onChange={(e) => setInputUnit(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all duration-200 cursor-pointer"
                >
                  <option value="g">Grams (g)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="mL">Milliliters (mL)</option>
                  <option value="L">Liters (L)</option>
                  <option value="item">Item / Pack</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Price (USD) per Unit</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={inputPrice}
                  onChange={(e) => setInputPrice(e.target.value)}
                  placeholder="24.99"
                  className="mt-1 block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Stock Quantity (in selected unit)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={inputStock}
                  onChange={(e) => setInputStock(e.target.value)}
                  placeholder="e.g. 5"
                  className="mt-1 block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Image URL</label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="mt-1 block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full flex items-center justify-center rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 px-4 py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {formLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                'Add Chemical Product'
              )}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'manage-products' && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <th className="px-6 py-4">Chemical Name</th>
                  <th className="px-6 py-4 text-right">Display Price</th>
                  <th className="px-6 py-4 text-center">Converted Stock</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                {loadingProducts ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-400">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                    </td>
                  </tr>
                ) : products.length > 0 ? (
                  products.map((product) => {
                    // Convert internal base units to human-friendly display units
                    const display = getDisplayValues(product.stockQuantity, product.basePrice, product.baseUnit);
                    const isOutOfStock = parseFloat(product.stockQuantity) <= 0;

                    return (
                      <tr key={product.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{product.name}</span>
                            {product.sku && (
                              <span className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 ring-1 ring-inset ring-indigo-600/10 font-mono">
                                {product.sku}
                              </span>
                            )}
                            {product.dimension && (
                              <span className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-450">
                                {product.dimension}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-400 truncate max-w-md mt-1">{product.description}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-medium text-zinc-900 dark:text-zinc-50">
                            {formatCurrency(display.displayPrice)} <span className="text-xs text-zinc-400 font-normal">/ {display.displayUnit}</span>
                          </div>
                          <div className="text-[11px] text-zinc-450 dark:text-zinc-500 font-semibold font-mono mt-0.5">
                            {formatINR(display.displayPrice)} <span className="text-[9px] text-zinc-400 font-normal font-sans">/ {display.displayUnit}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              !isOutOfStock
                                ? 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                            }`}
                          >
                            {display.displayQuantity} {display.displayUnit}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-3">
                            <button
                              onClick={() => handleStartEdit(product)}
                              className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-xs font-medium text-rose-650 hover:text-rose-555 dark:text-rose-400 cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-400">
                      No products found. Add some products to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'edit-product' && editingProduct && (
        <div className="max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm animate-fade-in">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Edit Chemical: {editingProduct.name}</h2>
          <form onSubmit={handleUpdateProduct} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Chemical Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all duration-200"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">SKU Code</label>
                <input
                  type="text"
                  required
                  value={editSku}
                  onChange={(e) => setEditSku(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Dimension / Physical State</label>
                <select
                  required
                  value={editDimension}
                  onChange={(e) => setEditDimension(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all duration-200 cursor-pointer"
                >
                  <option value="Solid">Solid</option>
                  <option value="Liquid">Liquid</option>
                  <option value="Gas">Gas</option>
                  <option value="Other">Other / Solid Mix</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Input Unit</label>
                <select
                  required
                  value={editInputUnit}
                  onChange={(e) => setEditInputUnit(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all duration-200 cursor-pointer"
                >
                  <option value="g">Grams (g)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="mL">Milliliters (mL)</option>
                  <option value="L">Liters (L)</option>
                  <option value="item">Item / Pack</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Price (USD) per Unit</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editInputPrice}
                  onChange={(e) => setEditInputPrice(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Stock Quantity (in selected unit)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editInputStock}
                  onChange={(e) => setEditInputStock(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Image URL</label>
                <input
                  type="url"
                  value={editImage}
                  onChange={(e) => setEditImage(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={formLoading}
                className="flex-1 flex items-center justify-center rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 px-4 py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {formLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  'Save Changes'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setActiveTab('manage-products');
                }}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 px-6 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition-all duration-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
