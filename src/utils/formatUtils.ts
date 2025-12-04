// utils/formatUtils.ts
export const formatCurrency = (value: number | string): string => {
  if (!value && value !== 0) return '0';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  
  // Format with thousands separator and 2 decimal places
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const parseCurrency = (value: string): number => {
  if (!value) return 0;
  
  // Remove commas and any non-numeric characters except decimal point
  const cleaned = value.replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? 0 : num;
};