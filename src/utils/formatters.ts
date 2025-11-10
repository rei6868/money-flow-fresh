// src/utils/formatters.ts

export function formatCurrency(
  amount: number,
  currency: string = 'VND'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateShort(date: Date | string): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
}

export function truncateString(str: string, maxLen: number): string {
  if (str.length <= maxLen) {
    return str;
  }
  return str.slice(0, maxLen) + '...';
}

export function formatAccountType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1) + ' Account';
}

export function formatTransactionType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'text-green-500';
    case 'inactive':
      return 'text-yellow-500';
    case 'closed':
        return 'text-gray-500';
    case 'pending':
        return 'text-blue-500';
    case 'overdue':
        return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}
