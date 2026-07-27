import { Offer, ConsumptionRecord, UtilityType } from '@/types';

export function recommendOffer(consumptions: ConsumptionRecord[], offers: Offer[]) {
  const getRecommendationForUtility = (type: UtilityType, monthlyWeights: number[]) => {
    const utilityConsumptions = consumptions.filter((c) => c.utility === type);
    
    if (utilityConsumptions.length === 0) {
      return {
        recommendedOffer: null,
        estimatedAnnualCost: 0,
        estimatedAnnualUnits: 0,
        analysis: `Nessun dato di consumo disponibile per ${type === 'electricity' ? 'la Luce' : 'il Gas'}.`,
      };
    }

    let sumWeights = 0;
    let sumNormalizedConsumptions = 0;

    for (const record of utilityConsumptions) {
      const weight = monthlyWeights[record.month - 1];
      sumWeights += weight;
      sumNormalizedConsumptions += record.consumption / weight;
    }

    // Estimate base monthly consumption
    const baseMonthlyConsumption = sumNormalizedConsumptions / utilityConsumptions.length;

    // Estimate annual units
    let estimatedAnnualUnits = 0;
    for (let i = 0; i < 12; i++) {
      estimatedAnnualUnits += baseMonthlyConsumption * monthlyWeights[i];
    }

    let bestOffer: Offer | null = null;
    let lowestAnnualCost = Infinity;

    const utilityOffers = offers.filter((o) => o.utility === type);

    for (const offer of utilityOffers) {
      // Cost = (fixed monthly * 12) + (price per unit * annual units)
      const annualCost = (offer.fixedMonthlyFee * 12) + (offer.pricePerUnit * estimatedAnnualUnits);
      
      if (annualCost < lowestAnnualCost) {
        lowestAnnualCost = annualCost;
        bestOffer = offer;
      }
    }

    const unitLabel = type === 'electricity' ? 'kWh' : 'smc';
    return {
      recommendedOffer: bestOffer,
      estimatedAnnualCost: lowestAnnualCost,
      estimatedAnnualUnits,
      analysis: `Basato su un modello di regressione stagionale con un consumo stimato di ${estimatedAnnualUnits.toFixed(0)} ${unitLabel} all'anno.`,
    };
  };

  // Electricity weights (peaks in summer and winter)
  const electricityWeights = [1.2, 1.1, 1.0, 0.9, 0.8, 0.9, 1.0, 1.0, 0.9, 0.9, 1.1, 1.2];
  
  // Gas weights (highly concentrated in winter months)
  const gasWeights = [2.2, 2.0, 1.5, 0.6, 0.2, 0.1, 0.1, 0.1, 0.1, 0.5, 1.5, 2.1];

  const electricityRec = getRecommendationForUtility('electricity', electricityWeights);
  const gasRec = getRecommendationForUtility('gas', gasWeights);

  // Backward compatibility wrapper, fallback fields
  return {
    electricity: electricityRec,
    gas: gasRec,
    recommendedOffer: electricityRec.recommendedOffer,
    estimatedAnnualCost: electricityRec.estimatedAnnualCost + gasRec.estimatedAnnualCost,
    analysis: electricityRec.analysis,
  };
}
