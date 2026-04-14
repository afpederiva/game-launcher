import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Gamepad2, Pencil } from 'lucide-react';

function getGameDisplayName(game) {
  return game?.customName || game?.normalizedName || game?.originalName || '(Unnamed game)';
}

function CoverImage({ coverPath, title, console: consoleName, coverDisplay }) {
  const [url, setUrl] = React.useState('');
  const [error, setError] = React.useState(false);

  useEffect(() => {
    let active = true;
    setError(false);
    
    
    if (!coverPath) {
      setUrl('');
      return;
    }

    if (!window.launcher?.resolveCoverUrl) {
      console.warn('resolveCoverUrl not available');
      setUrl('');
      return;
    }
    
    window.launcher
      .resolveCoverUrl({ coverPath })
      .then((resolved) => {
        if (active) {
          setUrl(resolved || '');
        }
      })
      .catch((err) => {
        console.error('Error resolving cover:', coverPath, err);
        if (active) {
          setUrl('');
        }
      });
    
    return () => {
      active = false;
    };
  }, [coverPath]);

  if (!url || error) {
    // Elegant gradient fallback
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
      <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-6`}>
        <Gamepad2 className="w-16 h-16 text-white/40 mb-4" />
        <div className="text-center">
          <div className="text-white font-bold text-lg mb-1 line-clamp-3">
            {title}
          </div>
          {consoleName && (
            <div className="text-white/60 text-xs uppercase tracking-wider">
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
      className="w-full h-full"
      style={{ backgroundColor: '#0b0e14', objectFit: coverDisplay === 'cover' ? 'cover' : 'contain' }}
    />
  );
}

function getStatusLabel(status) {
  switch (status) {
    case 'playing':
      return 'Playing';
    case 'completed':
      return 'Completed';
    case 'not_started':
    default:
      return 'Not Started';
  }
}

export default function GameCard({ game, onPlay, onStatusChange, onEditCover, coverDisplay = 'contain', index = 0, viewMode = 'grid' }) {
  const displayName = getGameDisplayName(game);
  const statusLabel = getStatusLabel(game.status || 'not_started');
  const [isHovered, setIsHovered] = useState(false);

  // List mode
  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '12px',
          backgroundColor: 'rgba(28, 33, 48, 0.4)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          transition: 'all 0.2s',
          width: '100%'
        }}
      >
        {/* Mini Cover */}
        <div style={{ 
          width: '72px', 
          height: '96px', 
          borderRadius: '6px', 
          overflow: 'hidden',
          flexShrink: 0,
          backgroundColor: '#0b0e14',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          position: 'relative'
        }}>
          <CoverImage 
            coverPath={game.coverPath} 
            title={displayName}
            console={game.console}
            coverDisplay={coverDisplay}
          />
          {isHovered && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditCover?.(game);
              }}
              style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              aria-label="Edit cover"
            >
              <Pencil style={{ width: '14px', height: '14px', color: '#e6e6eb' }} />
            </button>
          )}
        </div>

        {/* Game Info */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <h3 style={{ 
              color: '#e6e6eb', 
              fontWeight: '600', 
              fontSize: '15px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1
            }}>
              {displayName}
            </h3>
            <span style={{
              fontSize: '11px',
              color: '#9aa0b3',
              padding: '4px 8px',
              borderRadius: 999,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: '#1c2130',
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}>
              {game.console}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#9aa0b3', fontSize: '12px' }}>
              <span style={{ opacity: 0.7 }}>{game.emulator}</span>
              <span style={{ opacity: 0.4 }}>•</span>
              <span style={{ fontSize: 11 }}>{statusLabel}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select
                value={game.status || 'not_started'}
                onChange={(e) => onStatusChange?.(game, e.target.value)}
                style={{
                  backgroundColor: '#1c2130',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#e6e6eb',
                  padding: '4px 6px',
                  borderRadius: '6px',
                  fontSize: '11px'
                }}
              >
                <option value="not_started">Not Started</option>
                <option value="playing">Playing</option>
                <option value="completed">Completed</option>
              </select>
              <button
                onClick={() => onPlay?.(game)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#7c7cff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                aria-label="Play game"
              >
                <Play style={{ width: '18px', height: '18px', color: 'white', marginLeft: '2px' }} fill="currentColor" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid mode (original)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.3,
        delay: index * 0.03,
        ease: "easeOut"
      }}
      whileHover={{ y: -4, zIndex: 10 }}
      className="relative"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Card Container */}
      <div className="w-full rounded-xl overflow-hidden" style={{ backgroundColor: '#151923', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <div style={{ width: '100%', aspectRatio: '2 / 3', backgroundColor: '#0b0e14', padding: '10px', position: 'relative' }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#0b0e14' }}>
            <CoverImage 
              coverPath={game.coverPath} 
              title={displayName}
              console={game.console}
              coverDisplay={coverDisplay}
            />
          </div>
          {isHovered && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditCover?.(game);
              }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              aria-label="Edit cover"
            >
              <Pencil style={{ width: '14px', height: '14px', color: '#e6e6eb' }} />
            </button>
          )}
        </div>

        <div style={{ padding: '12px 12px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h3 style={{ color: '#e6e6eb', fontWeight: 600, fontSize: '14px', lineHeight: '1.2', minHeight: '34px' }}>
            {displayName}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: '#9aa0b3' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{game.console}</span>
              <select
                value={game.status || 'not_started'}
                onChange={(e) => onStatusChange?.(game, e.target.value)}
                style={{
                  backgroundColor: '#1c2130',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#e6e6eb',
                  padding: '4px 6px',
                  borderRadius: '6px',
                  fontSize: '11px'
                }}
              >
                <option value="not_started">Not Started</option>
                <option value="playing">Playing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <button
              onClick={() => onPlay?.(game)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#7c7cff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Play game"
            >
              <Play style={{ width: '18px', height: '18px', color: 'white', marginLeft: '2px' }} fill="currentColor" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
