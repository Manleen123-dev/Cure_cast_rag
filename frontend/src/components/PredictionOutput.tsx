import React from 'react';
import PredictionCard from './PredictionCard';

interface Prediction {
  Disease: string;
  Percent: number;
  Severity: string;
  Specialist: string;
}

interface PredictionOutputProps {
  predictions: Prediction[];
}

const PredictionOutput: React.FC<PredictionOutputProps> = ({ predictions }) => {
  if (predictions.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold text-center mb-4 text-cyan-400">Top 3 Predictions</h2>
      {predictions.map((prediction) => (
        <PredictionCard
          key={prediction.Disease}
          disease={prediction.Disease}
          confidence={prediction.Percent}
          severity={prediction.Severity}
          specialist={prediction.Specialist}
        />
      ))}
    </div>
  );
};

export default PredictionOutput;
