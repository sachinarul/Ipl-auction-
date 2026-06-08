// Official IPL-style bid increment table
export function getNextIncrement(bid: number): number {
  if (bid < 1.00) return 0.05;
  if (bid < 2.00) return 0.10;
  if (bid < 5.00) return 0.20; // 20 Lakhs increment
  if (bid < 10.00) return 0.50;
  if (bid < 20.00) return 1.00;
  return 2.00;
}

export function getNextBid(currentBid: number): number {
  return parseFloat((currentBid + getNextIncrement(currentBid)).toFixed(2));
}

export function formatCr(val: number): string {
  if (val < 1) return `${Math.round(val * 100)}L`;
  if (val % 1 === 0) return `${val}Cr`;
  return `${val.toFixed(2)}Cr`;
}
