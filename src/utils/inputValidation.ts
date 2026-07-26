import React from 'react';

/**
 * KeyDown handler to allow only integer digits (0-9) and standard control keys.
 */
export const allowOnlyNumbersKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const allowedKeys = [
    'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
    'ArrowLeft', 'ArrowRight', 'Home', 'End'
  ];
  if (
    allowedKeys.includes(e.key) ||
    e.ctrlKey ||
    e.metaKey
  ) {
    return;
  }
  if (!/^[0-9]$/.test(e.key)) {
    e.preventDefault();
  }
};

/**
 * KeyDown handler to allow digits (0-9), max one decimal point (.), and standard control keys.
 */
export const allowOnlyDecimalKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const allowedKeys = [
    'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
    'ArrowLeft', 'ArrowRight', 'Home', 'End'
  ];
  if (
    allowedKeys.includes(e.key) ||
    e.ctrlKey ||
    e.metaKey
  ) {
    return;
  }
  if (e.key === '.') {
    if (e.currentTarget.value.includes('.')) {
      e.preventDefault();
    }
    return;
  }
  if (!/^[0-9]$/.test(e.key)) {
    e.preventDefault();
  }
};

/**
 * Sanitizes input string to only contain digits (0-9).
 */
export const sanitizeInteger = (val: string): string => {
  return val.replace(/[^0-9]/g, '');
};

/**
 * Sanitizes input string to only contain decimal numbers (digits and at most 1 decimal point).
 */
export const sanitizeDecimal = (val: string): string => {
  const cleaned = val.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  return cleaned;
};
