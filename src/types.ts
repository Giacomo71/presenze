export type UtilityType = 'electricity' | 'gas';

export interface Offer {
  provider: string;
  utility: UtilityType;
  pricePerUnit: number; // €/kWh for electricity, €/smc for gas
  fixedMonthlyFee: number; // € per month
  contractLengthMonths: number;
}

export interface ConsumptionRecord {
  utility: UtilityType;
  month: number; // 1-12
  year: number;
  consumption: number; // kWh for electricity, smc for gas
}
