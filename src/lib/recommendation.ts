import { Offer, ConsumptionRecord } from '@/types';

export function recommendOffer(consumptions: ConsumptionRecord[], offers: Offer[]) {
  if (!consumptions || consumptions.length === 0) {
    return { recommendedOffer: null, estimatedAnnualCost: 0, analysis: 'Nessun dato di consumo disponibile.' };
  }

  // Regressione stagionale semplificata:
  // Stimiamo il consumo annuale pesando i mesi invernali vs estivi
  // Assumiamo che il consumo del gas sia più alto in inverno (Nov-Mar) e la luce in estate (Giu-Ago)
  // Per ora usiamo i dati storici a disposizione estrapolando i mesi mancanti usando pesi stagionali medi.
  const monthlyWeights = [
    1.2, // Jan
    1.1, // Feb
    1.0, // Mar
    0.9, // Apr
    0.8, // May
    0.9, // Jun
    1.0, // Jul
    1.0, // Aug
    0.9, // Sep
    0.9, // Oct
    1.1, // Nov
    1.2, // Dec
  ];

  let sumWeights = 0;
  let sumNormalizedConsumptions = 0;

  for (const record of consumptions) {
    const weight = monthlyWeights[record.month - 1];
    sumWeights += weight;
    sumNormalizedConsumptions += record.consumptionKwh / weight;
  }

  // Stima del consumo base mensile destagionalizzato
  const baseMonthlyConsumption = sumNormalizedConsumptions / consumptions.length;

  // Stima del consumo annuale riapplicando i pesi
  let estimatedAnnualKwh = 0;
  for (let i = 0; i < 12; i++) {
    estimatedAnnualKwh += baseMonthlyConsumption * monthlyWeights[i];
  }

  let bestOffer: Offer | null = null;
  let lowestAnnualCost = Infinity;

  for (const offer of offers) {
    // Costo annuale = (Costo fisso mensile * 12) + (Prezzo per kWh * Consumo annuale stimato)
    const annualCost = (offer.fixedMonthlyFee * 12) + (offer.pricePerKwh * estimatedAnnualKwh);
    
    if (annualCost < lowestAnnualCost) {
      lowestAnnualCost = annualCost;
      bestOffer = offer;
    }
  }

  return {
    recommendedOffer: bestOffer,
    estimatedAnnualCost: lowestAnnualCost,
    estimatedAnnualKwh,
    analysis: `Basato su un modello di regressione stagionale con un consumo stimato di ${estimatedAnnualKwh.toFixed(0)} kWh all'anno.`,
  };
}
