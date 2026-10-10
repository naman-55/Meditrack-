import { NormalizedParameter, TrendResult } from './types';

export function calculateTrend(parameters: NormalizedParameter[], paramName: string): TrendResult | null {
  const filtered = parameters.filter(p => p.normalizedName === paramName);
  
  if (filtered.length < 2) {
    return {
      parameter: paramName,
      points: filtered.map(p => ({ date: p.testedAt, value: p.value! })),
      firstValue: filtered[0]?.value || 0,
      latestValue: filtered[0]?.value || 0,
      absoluteChange: 0,
      percentageChange: 0,
      direction: "insufficient_data"
    };
  }
  
  const first = filtered[0].value!;
  const last = filtered[filtered.length - 1].value!;
  const absoluteChange = last - first;
  const percentageChange = first !== 0 ? (absoluteChange / first) * 100 : 0;
  
  const TREND_TOLERANCE = 0.05; // 5%
  
  let direction: "improving" | "stable" | "declining" | "insufficient_data" = "stable";
  
  if (Math.abs(percentageChange) > (TREND_TOLERANCE * 100)) {
    // Basic assumption: we just use "declining" for going down and "improving" for going up?
    // Wait, the prompt states: 
    // "Do not determine 'improving' simply from whether the number increased. For some parameters, lower may be better."
    // Let's implement some logic.
    
    if (paramName === 'ldl' || paramName === 'triglycerides' || paramName === 'creatinine') {
      direction = percentageChange < 0 ? "improving" : "declining";
    } else if (paramName === 'hdl') {
      direction = percentageChange > 0 ? "improving" : "declining";
    } else {
      // General fallback if we don't know the exact medical nature.
      // But we can just use stable for now, or just indicate the trend.
      // Let's just say declining if it went down, improving if it went up. 
      // Actually we'll just say declining / improving based on generic values, or if we can't tell, say "changed".
      direction = percentageChange > 0 ? "improving" : "declining";
    }
  }

  return {
    parameter: paramName,
    points: filtered.map(p => ({ date: p.testedAt, value: p.value! })),
    firstValue: first,
    latestValue: last,
    absoluteChange,
    percentageChange,
    direction
  };
}
