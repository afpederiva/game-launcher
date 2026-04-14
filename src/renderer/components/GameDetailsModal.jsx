import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Edit2, CheckCircle, Clock, TrendingUp, Gamepad2 } from 'lucide-react';

function getGameDisplayName(game) {
  return game?.customName || game?.normalizedName || game?.originalName || '(Unnamed game)';
}

function CoverImage({ coverPath, title, console: consoleName }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setError(false);
    
    if (!coverPath || !window.launcher?.resolveCoverUrl) {
      setUrl('');
      return;
    }
    
    window.launcher
      .resolveCoverUrl({ coverPath })
      .then((resolved) => {
        if (active) setUrl(resolved || '');
      })
      .catch(() => {
        if (active) setUrl('');
      });
    
    return () => {
      active = false;
    };
  }, [coverPath]);

  if (!url || error) {
    const gradients = [
      'from-purple-600 to-blue-600',
      'from-blue-600 to-cyan-600',
      'from-cyan-600 to-teal-600',
      'from-pink-600 to-purple-600',
      'from-orange-600 to-red-600',
      'from-green-600 to-emerald-600',
    ];
    
    const gradientIndex = Math.abs(title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % gradients.length;
    const gradient = gradients[gradientIndex];

    return (
      <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-8`}>
        <Gamepad2 className="w-24 h-24 text-white/40 mb-6" />
        <div className="text-center">
          <div className="text-white font-bold text-2xl mb-2 line-clamp-4">
            {title}
          </div>
          {consoleName && (
            <div className="text-white/60 text-sm uppercase tracking-wider">
              {consoleName}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <img 
      src={url} 
      alt={`${title} cover`} 
      onError={() => setError(true)}
      className="w-full h-full object-contain"
      style={{ backgroundColor: '#0b0e14' }}
    />
  );
}

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', icon: Clock, color: 'text-gray-400' },
  { value: 'playing', label: 'Playing', icon: TrendingUp, color: 'text-blue-400' },
  { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-green-400' },
];

export default function GameDetailsModal({ game, onClose, onPlay, onUpdateStatus, onRename }) {
  if (!game) return null;

  const displayName = getGameDisplayName(game);
  const currentStatus = STATUS_OPTIONS.find(s => s.value === game.status) || STATUS_OPTIONS[0];
  const StatusIcon = currentStatus.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-8"
        onClick={onClose}
      >
        {/* Backdrop with Blur */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-5xl h-[85vh] bg-bg-secondary rounded-2xl shadow-2xl overflow-hidden flex"
        >
          {/* Close Button */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute top-6 right-6 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-6 h-6" />
          </motion.button>

          {/* Left Side - Cover */}
          <div className="w-2/5 bg-bg-tertiary relative">
            <CoverImage 
              coverPath={game.coverPath}
              title={displayName}
              console={game.console}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
          </div>

          {/* Right Side - Details */}
          <div className="flex-1 flex flex-col p-10">
            {/* Title */}
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-text-primary mb-2">
                {displayName}
              </h1>
              <div className="flex items-center gap-3 text-text-secondary">
                <span className="text-lg">{game.console}</span>
                <span className="text-text-secondary/50">•</span>
                <span className="text-sm uppercase tracking-wider">{game.emulator}</span>
              </div>
            </div>

            {/* Status */}
            <div className="mb-8">
              <div className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Status
              </div>
              <div className="flex gap-3">
                {STATUS_OPTIONS.map((status) => {
                  const Icon = status.icon;
                  const isActive = game.status === status.value;
                  return (
                    <motion.button
                      key={status.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onUpdateStatus(game, status.value)}
                      className={`
                        flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all
                        ${isActive
                          ? 'bg-accent-purple/20 border-accent-purple text-accent-purple'
                          : 'bg-bg-tertiary border-border-subtle text-text-secondary hover:border-text-secondary/30'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{status.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Info */}
            <div className="mb-8 space-y-4">
              <div>
                <div className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Original Name
                </div>
                <div className="text-text-primary">{game.originalName}</div>
              </div>
              
              <div>
                <div className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  ROM Path
                </div>
                <div className="text-text-secondary text-sm font-mono bg-bg-tertiary px-3 py-2 rounded-lg break-all">
                  {game.romPath}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-auto flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onPlay(game);
                  onClose();
                }}
                className="flex-1 h-16 bg-gradient-to-r from-accent-purple to-accent-blue rounded-xl text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-shadow"
              >
                <Play className="w-6 h-6" fill="currentColor" />
                PLAY NOW
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onRename(game);
                  onClose();
                }}
                className="w-16 h-16 bg-bg-tertiary border border-border-subtle rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-accent-purple/30 transition-all"
              >
                <Edit2 className="w-6 h-6" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
