import React from 'react';
import { motion } from 'framer-motion';
import { 
  Gamepad2, 
  CheckSquare, 
  Clock,
  TrendingUp
} from 'lucide-react';

const STATUS_FILTERS = [
  { value: 'all', label: 'All Games', icon: Gamepad2 },
  { value: 'not_started', label: 'Not Started', icon: Clock },
  { value: 'playing', label: 'Playing', icon: TrendingUp },
  { value: 'completed', label: 'Completed', icon: CheckSquare },
];

const styles = {
  sidebar: {
    width: '288px',
    height: '100%',
    backgroundColor: '#151923',
    borderRight: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 40,
    overflow: 'hidden'
  },
  logoSection: {
    padding: '24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    flexShrink: 0
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  logoIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #7c7cff 0%, #4cc2ff 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#e6e6eb'
  },
  logoSubtitle: {
    fontSize: '12px',
    color: '#9aa0b3'
  },
  section: {
    padding: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    flexShrink: 0
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#9aa0b3',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '12px'
  },
  filterButton: (isActive) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    border: isActive ? '1px solid rgba(124, 124, 255, 0.3)' : 'none',
    backgroundColor: isActive ? 'rgba(124, 124, 255, 0.2)' : 'transparent',
    color: isActive ? '#7c7cff' : '#9aa0b3',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '4px'
  }),
  consoleList: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px'
  },
  consoleButton: (isActive) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderRadius: '8px',
    border: isActive ? '1px solid rgba(76, 194, 255, 0.3)' : 'none',
    backgroundColor: isActive ? 'rgba(76, 194, 255, 0.2)' : 'transparent',
    color: isActive ? '#4cc2ff' : '#9aa0b3',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '4px'
  }),
  consoleCount: {
    fontSize: '12px',
    padding: '2px 8px',
    borderRadius: '9999px',
    backgroundColor: '#0b0e14',
    flexShrink: 0
  },
  footer: {
    padding: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    flexShrink: 0,
    textAlign: 'center',
    fontSize: '12px',
    color: '#9aa0b3'
  }
};

export default function Sidebar({ 
  consoles, 
  selectedConsole, 
  onSelectConsole,
  statusFilter,
  onStatusFilterChange,
  totalGames 
}) {
  return (
    <motion.aside 
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      style={styles.sidebar}
    >
      {/* Logo Section */}
      <div style={styles.logoSection}>
        <div style={styles.logoContainer}>
          <div style={styles.logoIcon}>
            <Gamepad2 style={{ width: '28px', height: '28px', color: 'white' }} />
          </div>
          <div>
            <h1 style={styles.logoTitle}>Retro</h1>
            <p style={styles.logoSubtitle}>Game Launcher</p>
          </div>
        </div>
      </div>

      {/* Status Filters */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Filter</div>
        {STATUS_FILTERS.map((filter) => {
          const Icon = filter.icon;
          const isActive = statusFilter === filter.value;
          return (
            <motion.button
              key={filter.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onStatusFilterChange(filter.value)}
              style={styles.filterButton(isActive)}
            >
              <Icon style={{ width: '16px', height: '16px' }} />
              <span>{filter.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Console List */}
      <div style={styles.consoleList}>
        <div style={styles.sectionTitle}>Consoles</div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectConsole(null)}
          style={styles.consoleButton(!selectedConsole)}
        >
          <span>All Consoles</span>
          <span style={styles.consoleCount}>{totalGames}</span>
        </motion.button>

        {consoles.map((console) => (
          <motion.button
            key={console.name}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectConsole(console.name)}
            style={styles.consoleButton(selectedConsole === console.name)}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {console.name}
            </span>
            <span style={styles.consoleCount}>{console.count}</span>
          </motion.button>
        ))}
      </div>

      {/* Footer Info */}
      <div style={styles.footer}>
        {totalGames} games in library
      </div>
    </motion.aside>
  );
}
