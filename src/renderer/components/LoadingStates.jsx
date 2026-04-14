import React from 'react';
import { motion } from 'framer-motion';

export default function GameCardSkeleton({ index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="relative"
      style={{ aspectRatio: '2/3' }}
    >
      <div className="w-full h-full rounded-xl overflow-hidden bg-bg-tertiary">
        {/* Shimmer effect */}
        <div className="relative w-full h-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-bg-secondary/50 to-transparent animate-[shimmer_2s_infinite]" 
               style={{ 
                 animation: 'shimmer 2s infinite',
                 backgroundSize: '200% 100%'
               }} 
          />
        </div>
        
        {/* Bottom info placeholder */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="h-4 bg-bg-secondary rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-bg-secondary rounded w-1/2"></div>
        </div>
      </div>
    </motion.div>
  );
}

// Loading grid component
export function LoadingGrid({ count = 12 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <GameCardSkeleton key={index} index={index} />
      ))}
    </div>
  );
}

// Add shimmer animation to tailwind config or global CSS
