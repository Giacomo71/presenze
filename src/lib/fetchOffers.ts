import type { Offer } from '@/types';

// Stub implementation – in a real app you would scrape ilportaleofferte.it or use an official API.
export async function fetchOffers(): Promise<Offer[]> {
  return [
    // LUCE / ELECTRICITY (price per kWh in €/kWh, fixed fee €/month)
    {
      provider: 'EnergiaPlus',
      utility: 'electricity',
      pricePerUnit: 0.12,
      fixedMonthlyFee: 5,
      contractLengthMonths: 12,
    },
    {
      provider: 'EcoPower',
      utility: 'electricity',
      pricePerUnit: 0.10,
      fixedMonthlyFee: 8,
      contractLengthMonths: 24,
    },
    {
      provider: 'GreenEnergy',
      utility: 'electricity',
      pricePerUnit: 0.11,
      fixedMonthlyFee: 6,
      contractLengthMonths: 12,
    },

    // GAS (price per SMC in €/smc, fixed fee €/month)
    {
      provider: 'GasPiù',
      utility: 'gas',
      pricePerUnit: 0.42,
      fixedMonthlyFee: 6,
      contractLengthMonths: 12,
    },
    {
      provider: 'BlueFlame',
      utility: 'gas',
      pricePerUnit: 0.38,
      fixedMonthlyFee: 9,
      contractLengthMonths: 24,
    },
    {
      provider: 'EcoGas',
      utility: 'gas',
      pricePerUnit: 0.40,
      fixedMonthlyFee: 7,
      contractLengthMonths: 12,
    },
  ];
}
