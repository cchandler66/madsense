export interface SPCDataPoint {
  batchNumber: number;
  hedonicScore: number;
}

export function predictNextBatchScore(historicalData: SPCDataPoint[]): { 
  predictedScore: number; 
  trend: 'Improving' | 'Degrading' | 'Stable'; 
  warning: boolean;
} {
  if (historicalData.length < 5) {
    return { predictedScore: 0, trend: 'Stable', warning: false }; // Not enough data
  }

  // Linear Regression Math
  const n = historicalData.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

  historicalData.forEach((point, i) => {
    // Treat chronological index as X to map deterioration over time
    const x = i + 1; 
    const y = point.hedonicScore;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Predict the *next* batch (n + 1)
  const nextX = n + 1;
  const predictedScore = (slope * nextX) + intercept;

  const trend = slope > 0.05 ? 'Improving' : slope < -0.05 ? 'Degrading' : 'Stable';
  // Assuming < 5.5 breaches LCL for hedonic
  const warning = trend === 'Degrading' && predictedScore < 5.5; 

  return {
    predictedScore: parseFloat(predictedScore.toFixed(2)),
    trend,
    warning
  };
}
