export interface Offer {
  provider: string;
  pricePerKwh: number; // €/kWh
  fixedMonthlyFee: number; // € per month
  contractLengthMonths: number;
}

export interface ConsumptionRecord {
  month: number; // 1‑12
  year: number;
  consumptionKwh: number;
}
