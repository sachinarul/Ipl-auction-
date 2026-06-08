// Official IPL-style bid increment slab table — V3
export function getNextIncrement(bid: number): number {
  if (bid < 0.50) return 0.10;   // 10L increments: 20L→30L→40L→50L
  if (bid < 1.00) return 0.25;   // 25L increments: 50L→75L→1Cr
  if (bid < 2.00) return 0.50;   // 50L increments: 1Cr→1.5Cr→2Cr
  if (bid < 5.00) return 1.00;   // 1Cr increments: 2Cr→3Cr→4Cr→5Cr
  if (bid < 10.00) return 0.50;  // 50L increments: 5Cr→5.5Cr→...→10Cr
  return 1.00;                    // 1Cr increments: 10Cr+
}

export function getNextBid(currentBid: number): number {
  return parseFloat((currentBid + getNextIncrement(currentBid)).toFixed(2));
}

export function formatCr(val: number): string {
  if (val === 0) return '₹0';
  if (val < 1.00) {
    const lakhs = Math.round(val * 100);
    return `₹${lakhs} Lakhs`;
  }
  if (val % 1 === 0) return `₹${val} Crore`;
  return `₹${val.toFixed(2)} Crore`;
}

export function formatCrShort(val: number): string {
  if (val === 0) return '₹0';
  if (val < 1.00) {
    const lakhs = Math.round(val * 100);
    return `₹${lakhs}L`;
  }
  if (val % 1 === 0) return `₹${val}Cr`;
  return `₹${val.toFixed(2)}Cr`;
}
