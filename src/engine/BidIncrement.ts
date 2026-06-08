// Official IPL-style bid increment slab table — V3 Dynamic Engine
export function getNextIncrement(bid: number): number {
  if (bid < 0.50) return 0.05;   // 5L increments: 20L→25L→30L→35L→40L→45L
  if (bid < 1.00) return 0.10;   // 10L increments: 50L→60L→70L→80L→90L
  if (bid < 2.00) return 0.10;   // 10L increments: 1Cr→1.10Cr→1.20Cr→1.30Cr
  if (bid < 5.00) return 0.20;   // 20L increments: 2Cr→2.20Cr→2.40Cr
  if (bid < 10.00) return 0.25;  // 25L increments: 5Cr→5.25Cr→5.50Cr
  if (bid < 20.00) return 0.50;  // 50L increments: 10Cr→10.50Cr
  return 1.00;                   // 1Cr increments: 20Cr+
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
    return `₹${lakhs} L`;
  }
  if (val % 1 === 0) return `₹${val} Cr`;
  return `₹${val.toFixed(2)} Cr`;
}
