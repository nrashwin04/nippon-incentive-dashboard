export interface Slab {
  id?: string;
  tierName: string;
  minCars: number;
  maxCars: number | null;
  incentivePerCar: number;
}

export function getActiveSlab(totalCars: number, slabs: Slab[]): Slab | null {
  const sorted = [...slabs].sort((a, b) => a.minCars - b.minCars);
  let active: Slab | null = null;
  for (const slab of sorted) {
    if (totalCars >= slab.minCars) {
      if (slab.maxCars === null || totalCars <= slab.maxCars) {
        active = slab;
      }
    }
  }
  return active;
}

export function calculatePayout(totalCars: number, slabs: Slab[]): number {
  const slab = getActiveSlab(totalCars, slabs);
  if (!slab || totalCars === 0) return 0;
  return totalCars * slab.incentivePerCar;
}

export function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
