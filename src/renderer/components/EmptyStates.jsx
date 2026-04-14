import React from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Search, FolderOpen } from 'lucide-react';

export function EmptyLibrary({ onOpenSettings }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-[70vh] px-8"
    >
      <motion.div
        animate={{ 
          y: [0, -10, 0],
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative mb-8"
      >
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-accent-purple/20 to-accent-blue/20 flex items-center justify-center backdrop-blur-sm border border-accent-purple/30">
          <Gamepad2 className="w-16 h-16 text-accent-purple" />
        </div>
        
        {/* Floating icons */}
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-accent-blue/20 flex items-center justify-center border border-accent-blue/30"
        >
          <FolderOpen className="w-6 h-6 text-accent-blue" />
        </motion.div>
      </motion.div>

      <h2 className="text-3xl font-bold text-text-primary mb-3">
        Your library is empty
      </h2>
      <p className="text-text-secondary text-center max-w-md mb-8">
        Start by adding your ROM folders in the settings, then scan your library to import games.
      </p>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onOpenSettings}
        className="px-6 py-3 bg-gradient-to-r from-accent-purple to-accent-blue rounded-lg text-white font-semibold flex items-center gap-2 shadow-lg"
      >
        <FolderOpen className="w-5 h-5" />
        Open Settings
      </motion.button>
    </motion.div>
  );
}

export function NoSearchResults({ searchQuery }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-[60vh] px-8"
    >
      <motion.div
        animate={{ 
          rotate: [0, 10, -10, 0],
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="mb-8"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center backdrop-blur-sm border border-accent-blue/30">
          <Search className="w-12 h-12 text-accent-blue" />
        </div>
      </motion.div>

      <h2 className="text-2xl font-bold text-text-primary mb-3">
        No games found
      </h2>
      <p className="text-text-secondary text-center max-w-md">
        No results for <span className="text-accent-purple font-semibold">"{searchQuery}"</span>
      </p>
      <p className="text-text-secondary text-sm mt-2">
        Try a different search term
      </p>
    </motion.div>
  );
}

export function NoGamesInFilter({ filterType }) {
  const messages = {
    completed: {
      icon: '🏆',
      title: 'No completed games yet',
      description: 'Mark games as completed as you finish them',
    },
    playing: {
      icon: '🎮',
      title: 'No games in progress',
      description: 'Start playing a game to see it here',
    },
    not_started: {
      icon: '📦',
      title: 'All games started',
      description: 'You\'ve started playing all your games!',
    },
  };

  const message = messages[filterType] || messages.not_started;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-[60vh] px-8"
    >
      <div className="text-7xl mb-6">
        {message.icon}
      </div>

      <h2 className="text-2xl font-bold text-text-primary mb-3">
        {message.title}
      </h2>
      <p className="text-text-secondary text-center max-w-md">
        {message.description}
      </p>
    </motion.div>
  );
}
