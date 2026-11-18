export function formatMoney(minor: number, currency: string): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(minor / 100)
}
