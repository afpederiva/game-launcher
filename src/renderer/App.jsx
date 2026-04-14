import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import GameCard from './components/GameCard';
import SettingsPanel from './components/SettingsPanel';
import CoverPanel from './components/CoverPanel';
import { EmptyLibrary, NoSearchResults, NoGamesInFilter } from './components/EmptyStates';
import { LoadingGrid } from './components/LoadingStates';

function getGameDisplayName(game) {
  return game?.customName || game?.normalizedName || game?.originalName || '(Unnamed game)';
}

export default function App() {
  const [library, setLibrary] = useState(null);
  const [config, setConfig] = useState(null);
  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem('ui.searchQuery') || '');
  const [selectedConsole, setSelectedConsole] = useState(() => localStorage.getItem('ui.selectedConsole') || null);
  const [statusFilter, setStatusFilter] = useState(() => localStorage.getItem('ui.statusFilter') || 'all');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('ui.viewMode') || 'grid');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [coverGame, setCoverGame] = useState(null);

  // Bootstrap and library updates
  useEffect(() => {
    if (!window.launcher) return;
    
    const disposeBootstrap = window.launcher.onBootstrap(({ config: cfg, library: lib }) => {
      setConfig(cfg);
      setLibrary(lib);
    });
    
    const disposeLibrary = window.launcher.onLibraryUpdated((lib) => {
      if (lib && Array.isArray(lib.emulators)) setLibrary(lib);
    });
    const disposeConfig = window.launcher.onConfigUpdated((cfg) => setConfig(cfg));
    
    return () => {
      disposeBootstrap?.();
      disposeLibrary?.();
      disposeConfig?.();
    };
  }, []);

  useEffect(() => {
    if (!window.launcher) return;

    const hydrate = async () => {
      try {
        const [cfg, lib] = await Promise.all([
          window.launcher.getConfig?.() ?? window.launcher.invoke('config:get'),
          window.launcher.invoke('library:getSnapshot'),
        ]);
        if (cfg) setConfig((prev) => prev || cfg);
        if (lib && Array.isArray(lib.emulators)) setLibrary((prev) => prev || lib);
      } catch {
        // ignore
      }
    };

    hydrate();
  }, []);

  useEffect(() => {
    localStorage.setItem('ui.searchQuery', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (selectedConsole) localStorage.setItem('ui.selectedConsole', selectedConsole);
    else localStorage.removeItem('ui.selectedConsole');
  }, [selectedConsole]);

  useEffect(() => {
    localStorage.setItem('ui.statusFilter', statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    localStorage.setItem('ui.viewMode', viewMode);
  }, [viewMode]);

  // Process games from library
  const allGames = useMemo(() => {
    const games = [];
    const emulators = library?.emulators || [];
    
    for (const emu of emulators) {
      for (const con of emu.consoles || []) {
        for (const game of con.games || []) {
          games.push({
            ...game,
            emulator: emu.name,
            emulatorId: emu.id,
            console: con.name,
            consoleId: con.id,
          });
        }
      }
    }
    
    return games;
  }, [library]);

  const allDisplayGames = useMemo(() => {
    const grouped = {};
    allGames.forEach((game) => {
      const key = `${game.emulator}||${game.console}||${game.normalizedName || game.originalName}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(game);
    });

    return Object.values(grouped).map((group) => ({
      ...group[0],
      discs: group,
      isMultiDisc: group.length > 1,
    }));
  }, [allGames]);

  // Console list with counts (grouped by normalized title)
  const consoles = useMemo(() => {
    const consoleMap = {};
    
    allDisplayGames.forEach(game => {
      if (!consoleMap[game.console]) {
        consoleMap[game.console] = { name: game.console, count: 0 };
      }
      consoleMap[game.console].count++;
    });
    
    return Object.values(consoleMap).sort((a, b) => a.name.localeCompare(b.name));
  }, [allDisplayGames]);

  // Filtered games
  const filteredGames = useMemo(() => {
    let filtered = [...allGames];

    // Filter by console
    if (selectedConsole) {
      filtered = filtered.filter(game => game.console === selectedConsole);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(game => (game.status || 'not_started') === statusFilter);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(game => 
        getGameDisplayName(game).toLowerCase().includes(query)
      );
    }

    // Sort alphabetically
    filtered.sort((a, b) => getGameDisplayName(a).localeCompare(getGameDisplayName(b)));

    return filtered;
  }, [allGames, selectedConsole, statusFilter, searchQuery]);

  // Group multi-disc games
  const displayGames = useMemo(() => {
    const grouped = {};
    
    filteredGames.forEach(game => {
      const key = `${game.emulator}||${game.console}||${game.normalizedName || game.originalName}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(game);
    });

    return Object.values(grouped).map(group => ({
      ...group[0],
      discs: group,
      isMultiDisc: group.length > 1,
    }));
  }, [filteredGames]);

  // Update game in library
  const updateGameInLibrary = (game, updater) => {
    setLibrary(prev => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      
      for (const emu of next.emulators || []) {
        if (emu.name !== game.emulator) continue;
        for (const con of emu.consoles || []) {
          if (con.name !== game.console) continue;
          for (const g of con.games || []) {
            if (g.romPath === game.romPath) {
              updater(g);
            }
          }
        }
      }
      
      return next;
    });
  };

  // Launch game
  const handlePlayGame = async (game) => {
    if (!window.launcher) return;

    // Handle multi-disc games
    if (game.isMultiDisc && game.discs?.length > 1) {
      // For now, launch the first disc
      // TODO: Show disc selection modal
      game = game.discs[0];
    }

    const result = await window.launcher.launchGame({
      emulatorId: game.emulatorId,
      consoleId: game.consoleId,
      romPath: game.romPath,
    });

    if (!result?.ok) {
      alert(result?.error || 'Failed to launch game');
    }
  };

  // Update game status
  const handleUpdateStatus = async (game, status) => {
    if (!window.launcher) return;

    await window.launcher.setGameStatus({
      emulator: game.emulator,
      romPath: game.romPath,
      status,
    });

    updateGameInLibrary(game, (g) => {
      g.status = status;
    });
  };

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

  const handleOpenCoverPicker = (game) => setCoverGame(game);

  const handleSaveCover = async ({ file, url }) => {
    if (!window.launcher || !coverGame) return;

    const normalizedName = coverGame.normalizedName || coverGame.originalName || '';
    let fileData = null;
    let fileName = null;

    if (file) {
      fileData = await readFileAsDataUrl(file);
      fileName = file.name;
    }

    const result = await window.launcher.saveCover({
      emulatorName: coverGame.emulator,
      consoleName: coverGame.console,
      normalizedName,
      fileData,
      fileName,
      url: url || null,
    });

    if (!result?.ok || !result.coverPath) {
      alert(result?.error || 'Failed to save cover');
      return;
    }

    await window.launcher.setGameCoverPath({
      emulator: coverGame.emulator,
      romPath: coverGame.romPath,
      coverPath: result.coverPath,
    });

    updateGameInLibrary(coverGame, (g) => {
      g.coverPath = result.coverPath;
    });

    setCoverGame(null);
  };

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      backgroundColor: '#0b0e14',
      color: '#e6e6eb',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ marginLeft: '288px', width: 'calc(100% - 288px)' }}>
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </div>

      {/* Content Container */}
      <div style={{ 
        display: 'flex',
        flex: 1,
        overflow: 'hidden'
      }}>
        {/* Sidebar */}
        <Sidebar
          consoles={consoles}
          selectedConsole={selectedConsole}
          onSelectConsole={setSelectedConsole}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          totalGames={allDisplayGames.length}
        />

        {/* Main Content */}
        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          marginLeft: '288px',
          width: 'calc(100% - 288px)'
        }}>

        {/* Game Grid */}
        <main style={{
          flex: 1,
          padding: '32px',
          overflowY: 'auto'
        }}>
          {/* Loading State */}
          {!library && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ height: '32px', width: '192px', backgroundColor: '#1c2130', borderRadius: '4px', marginBottom: '8px' }}></div>
                <div style={{ height: '16px', width: '128px', backgroundColor: '#1c2130', borderRadius: '4px' }}></div>
              </div>
              <LoadingGrid count={12} />
            </div>
          )}

          {/* Empty Library */}
          {library && allGames.length === 0 && (
            <EmptyLibrary onOpenSettings={() => setIsSettingsOpen(true)} />
          )}

          {/* No Search Results */}
          {library && allGames.length > 0 && displayGames.length === 0 && searchQuery && (
            <NoSearchResults searchQuery={searchQuery} />
          )}

          {/* No Games in Filter */}
          {library && allGames.length > 0 && displayGames.length === 0 && !searchQuery && statusFilter !== 'all' && (
            <NoGamesInFilter filterType={statusFilter} />
          )}

          {/* Games Grid */}
          {library && displayGames.length > 0 && (
            <>
              {/* Results Info */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '24px' }}
              >
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                  {selectedConsole || 'All Games'}
                </h2>
                <p style={{ color: '#9aa0b3' }}>
                  {displayGames.length} {displayGames.length === 1 ? 'game' : 'games'}
                </p>
              </motion.div>

              {/* Grid or List */}
              <div style={{
                display: viewMode === 'list' ? 'flex' : 'grid',
                flexDirection: viewMode === 'list' ? 'column' : undefined,
                gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(200px, 1fr))' : undefined,
                gap: viewMode === 'list' ? '12px' : '24px'
              }}>
                {displayGames.map((game, index) => (
                  <GameCard
                    key={`${game.emulator}-${game.romPath}`}
                    game={game}
                    index={index}
                    viewMode={viewMode}
                    onPlay={() => handlePlayGame(game)}
                    onStatusChange={handleUpdateStatus}
                    onEditCover={handleOpenCoverPicker}
                    coverDisplay={config?.ui?.coverDisplay || 'contain'}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      </div>
      </div>

      <SettingsPanel
        isOpen={isSettingsOpen}
        config={config}
        onClose={() => setIsSettingsOpen(false)}
        coverDisplay={config?.ui?.coverDisplay || 'contain'}
        onCoverDisplayChange={async (value) => {
          if (!window.launcher) return;
          await window.launcher.setUiSettings({ coverDisplay: value });
        }}
      />

      <CoverPanel
        isOpen={Boolean(coverGame)}
        game={coverGame}
        onClose={() => setCoverGame(null)}
        onSave={handleSaveCover}
      />
    </div>
  );
}
