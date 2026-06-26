import type { Offer } from '@/types';

// Stub implementation – in a real app you would scrape ilportaleofferte.it or use an official API.
export async function fetchOffers(): Promise<Offer[]> {
  // Example static offers (price per kWh in €/kWh, fixed fee € per month)
  return [
    {
      provider: 'EnergiaPlus',
      pricePerKwh: 0.12,
      fixedMonthlyFee: 5,
      contractLengthMonths: 12,
    },
    {
      provider: 'EcoPower',
      pricePerKwh: 0.10,
      fixedMonthlyFee: 8,
      contractLengthMonths: 24,
    },
    {
      provider: 'GreenEnergy',
      pricePerKwh: 0.11,
      fixedMonthlyFee: 6,
      contractLengthMonths: 12,
    },
  ];
}
