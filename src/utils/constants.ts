// src/utils/constants.ts

export const TRANSACTION_TYPES = [
  'expense',
  'income',
  'debt',
  'repayment',
  'cashback',
  'subscription',
  'import',
  'adjustment',
] as const;

export const ACCOUNT_TYPES = [
  'checking',
  'savings',
  'credit',
  'investment',
  'wallet',
] as const;

export const ACCOUNT_STATUS_OPTIONS = [
  'active',
  'inactive',
  'closed',
  'suspended',
] as const;

export const TRANSACTION_STATUS_OPTIONS = [
  'active',
  'pending',
  'void',
  'canceled',
] as const;

export const DEBT_LEDGER_STATUSES = [
  'open',
  'partial',
  'repaid',
  'overdue',
] as const;

export const DEFAULT_CURRENCY = 'VND';

export const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-500',
  inactive: 'text-yellow-500',
  closed: 'text-gray-500',
  pending: 'text-blue-500',
  overdue: 'text-red-500',
};
