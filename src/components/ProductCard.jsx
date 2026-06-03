import React from 'react';
import { formatCurrency, getDisplayValues } from '../lib/conversions';

export default function ProductCard({ product, onAddToCart }) {
  const { name, description, basePrice, stockQuantity, baseUnit, image } = product;

  // Convert raw base values from database to friendly displays
  const display = getDisplayValues(stockQuantity, basePrice, baseUnit);
  const isOutOfStock = parseFloat(display.displayQuantity) <= 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* Product Image Placeholder */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-400 dark:text-zinc-600">
            <svg
              className="h-12 w-12 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
          {name}
        </h3>
        <p className="mt-1 flex-1 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
          {description || 'No description available.'}
        </p>

        {/* Pricing & Stock */}
        <div className="mt-4 flex flex-col gap-1 justify-between">
          <div>
            <div className="flex flex-wrap items-baseline gap-1.5">
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-55">
                {formatCurrency(display.displayPrice)}
              </span>
              <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500"> / {display.displayUnit}</span>
            </div>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 block mt-1">
              {!isOutOfStock ? `${display.displayQuantity} ${display.displayUnit} available` : 'Out of stock'}
            </span>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={() => onAddToCart && onAddToCart(product)}
          disabled={isOutOfStock}
          className="mt-4 w-full flex items-center justify-center rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {!isOutOfStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}
