export const UNIT_TYPES = {
  MASS: ['g', 'kg'],
  VOLUME: ['mL', 'L'],
  COUNT: ['item']
};

export const BASE_UNITS = {
  g: 'g',
  kg: 'g',
  mL: 'mL',
  L: 'mL',
  item: 'item'
};

const CONVERSION_FACTORS = {
  g: 1,
  kg: 1000,
  mL: 1,
  L: 1000,
  item: 1
};

/**
 * Converts a quantity and unit to the internal base unit (g, mL, item).
 * @param {number} quantity 
 * @param {string} unit 
 * @returns {{ quantity: number, unit: string }}
 */
export function convertToBase(quantity, unit) {
  const baseUnit = BASE_UNITS[unit];
  if (!baseUnit) {
    throw new Error(`Unsupported unit: ${unit}`);
  }
  const factor = CONVERSION_FACTORS[unit];
  return {
    quantity: quantity * factor,
    unit: baseUnit
  };
}

/**
 * Converts a quantity from the base unit to a target unit.
 * @param {number} baseQuantity 
 * @param {string} targetUnit 
 * @returns {number}
 */
export function convertFromBase(baseQuantity, targetUnit) {
  const factor = CONVERSION_FACTORS[targetUnit];
  if (!factor) {
    throw new Error(`Unsupported target unit: ${targetUnit}`);
  }
  return baseQuantity / factor;
}

/**
 * Gets a user-friendly display representation of base unit quantities and prices.
 * e.g., if we have 1500g at $0.02/g, we display 1.5 kg at $20.00/kg.
 * @param {number} baseQuantity 
 * @param {number} basePricePerUnit 
 * @param {string} baseUnit 
 * @returns {{ displayQuantity: number, displayPrice: number, displayUnit: string }}
 */
export function getDisplayValues(baseQuantity, basePricePerUnit, baseUnit) {
  const qty = parseFloat(baseQuantity);
  const price = parseFloat(basePricePerUnit);
  
  if (baseUnit === 'g') {
    if (qty >= 1000) {
      return {
        displayQuantity: qty / 1000,
        displayPrice: price * 1000,
        displayUnit: 'kg'
      };
    }
    return {
      displayQuantity: qty,
      displayPrice: price,
      displayUnit: 'g'
    };
  }

  if (baseUnit === 'mL') {
    if (qty >= 1000) {
      return {
        displayQuantity: qty / 1000,
        displayPrice: price * 1000,
        displayUnit: 'L'
      };
    }
    return {
      displayQuantity: qty,
      displayPrice: price,
      displayUnit: 'mL'
    };
  }

  return {
    displayQuantity: qty,
    displayPrice: price,
    displayUnit: 'item'
  };
}

/**
 * Formats a number to USD currency format.
 * @param {number} value 
 * @returns {string}
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

/**
 * Formats a Date object or ISO string to a human-readable date.
 * @param {Date|string} date 
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Standardizes a product's price and stock representation.
 * @param {object} product 
 * @returns {object}
 */
export function normalizeProduct(product) {
  return {
    ...product,
    basePrice: typeof product.basePrice === 'string' ? parseFloat(product.basePrice) : product.basePrice,
    stockQuantity: typeof product.stockQuantity === 'string' ? parseFloat(product.stockQuantity) : product.stockQuantity,
  };
}
