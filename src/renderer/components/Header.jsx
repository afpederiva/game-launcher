import React from 'react';
import { motion } from 'framer-motion';
import { Search, Grid3x3, List, Settings, X } from 'lucide-react';

const styles = {
  header: {
    height: '64px',
    backgroundColor: 'rgba(21, 25, 35, 0.8)',
    backdropFilter: 'blur(40px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 32px',
    gap: '16px',
    position: 'relative',
    zIndex: 30,
    width: '100%'
  },
  searchContainer: {
    flex: 1,
    position: 'relative',
    minWidth: 0
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '20px',
    height: '20px',
    color: '#9aa0b3',
    pointerEvents: 'none'
  },
  searchInput: {
    width: '100%',
    height: '44px',
    paddingLeft: '48px',
    paddingRight: '40px',
    backgroundColor: '#1c2130',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    color: '#e6e6eb',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s'
  },
  clearButton: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9aa0b3',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'color 0.2s'
  },
  viewToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#1c2130',
    borderRadius: '8px',
    padding: '4px',
    border: '1px solid rgba(255, 255, 255, 0.05)'
  },
  rightControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginLeft: 'auto'
  },
  viewButton: (isActive) => ({
    width: '40px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    backgroundColor: isActive ? '#7c7cff' : 'transparent',
    color: isActive ? 'white' : '#9aa0b3',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }),
  settingsButton: {
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    backgroundColor: '#1c2130',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    color: '#9aa0b3',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};

export default function Header({ 
  searchQuery, 
  onSearchChange, 
  viewMode, 
  onViewModeChange,
  onOpenSettings
}) {
  return (
    <motion.header
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      style={styles.header}
    >
      {/* Search Bar */}
      <div style={styles.searchContainer}>
        <Search style={styles.searchIcon} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search games..."
          style={styles.searchInput}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            style={styles.clearButton}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        )}
      </div>

      <div style={styles.rightControls}>
        {/* View Mode Toggle */}
        <div style={styles.viewToggle}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onViewModeChange('grid')}
            style={styles.viewButton(viewMode === 'grid')}
          >
            <Grid3x3 style={{ width: '20px', height: '20px' }} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onViewModeChange('list')}
            style={styles.viewButton(viewMode === 'list')}
          >
            <List style={{ width: '20px', height: '20px' }} />
          </motion.button>
        </div>

        {/* Settings Button */}
        <motion.button
          whileHover={{ scale: 1.05, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
          style={styles.settingsButton}
          onClick={onOpenSettings}
        >
          <Settings style={{ width: '20px', height: '20px' }} />
        </motion.button>
      </div>
    </motion.header>
  );
}
