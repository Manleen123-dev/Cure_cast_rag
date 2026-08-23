import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="glassmorphism-card p-6 mb-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gray-700 rounded-md w-2/3"></div>
        <div className="h-8 bg-gray-700 rounded-md w-1/6"></div>
      </div>
      <div className="mt-4 space-y-3">
        <div className="h-4 bg-gray-700 rounded-md w-1/2"></div>
        <div className="h-4 bg-gray-700 rounded-md w-3/4"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;
