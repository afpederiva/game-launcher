// Legacy file kept as placeholder to avoid accidental imports.
export {};

import React, { useEffect, useMemo, useRef, useState } from 'react';

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'playing', label: 'Playing' },
  { value: 'completed', label: 'Completed' },
];

function getGameDisplayName(game) {
  return game?.customName || game?.normalizedName || game?.originalName || '(Unnamed game)';
}

function useClickOutside(ref, handler) {
  useEffect(() => {
    const onClick = (ev) => {
      if (!ref.current || ref.current.contains(ev.target)) return;
      handler();
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [handler, ref]);
}

function CoverImage({ coverPath, title }) {
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
    return (
      <div className="cover-placeholder">
        <div className="cover-placeholder__title">{title}</div>
      </div>
    );
  }

  return <img src={url} alt={`${title} cover`} onError={() => setError(true)} />;
}

function ContextMenu({ position, onClose, onRename, onCover, onSetStatus }) {
  const ref = useRef(null);
  useClickOutside(ref, onClose);

  if (!position) return null;

  return (
    <div className="context-menu" style={{ left: position.x, top: position.y }} ref={ref}>
      <div className="context-menu__item" onClick={onRename}>Rename game</div>
      <div className="context-menu__item" onClick={onCover}>Cover settings</div>
      <div className="context-menu__separator" />
      <div className="context-menu__label">Status</div>
      {STATUS_OPTIONS.map((opt) => (
        <div key={opt.value} className="context-menu__item" onClick={() => onSetStatus(opt.value)}>
          {opt.label}
        </div>
      ))}
    </div>
  );
}

function RenameModal({ game, onClose, onSave }) {
  const [value, setValue] = useState(getGameDisplayName(game));
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  if (!game) return null;

  return (
    <div className="modal-bg" onMouseDown={(e) => e.target.classList.contains('modal-bg') && onClose()}>
      <div className="modal">
        <h2>Rename: {getGameDisplayName(game)}</h2>
        <input
          ref={inputRef}
          className="input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <div className="modal__actions">
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={() => onSave(value)}>Save</button>
        </div>
      </div>
    </div>
  );
}

function CoverModal({ game, onClose, onSaved, onRemoved }) {
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else if (url && /^https?:\/\//.test(url)) {
      setPreview(url);
    } else {
      setPreview('');
    }
  }, [file, url]);

  if (!game) return null;

  const saveCover = async () => {
    if (!window.launcher?.saveCover) return;
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const fileData = ev.target.result;
        const result = await window.launcher.saveCover({
          emulatorName: game.emulator.name,
          consoleName: game.console.name,
          normalizedName: game.normalizedName || game.originalName || getGameDisplayName(game),
          fileData,
          fileName: file.name,
        });
        if (!result?.ok) return alert(result?.error || 'Failed to save cover');
        await window.launcher.setGameCoverPath({
          emulator: game.emulator.name,
          romPath: game.romPath,
          coverPath: result.coverPath,
        });
        onSaved(result.coverPath);
      };
      reader.readAsDataURL(file);
      return;
    }

    if (url && /^https?:\/\//.test(url)) {
      const result = await window.launcher.saveCover({
        emulatorName: game.emulator.name,
        consoleName: game.console.name,
        normalizedName: game.normalizedName || game.originalName || getGameDisplayName(game),
        url,
      });
      if (!result?.ok) return alert(result?.error || 'Failed to save cover');
      await window.launcher.setGameCoverPath({
        emulator: game.emulator.name,
        romPath: game.romPath,
        coverPath: result.coverPath,
      });
      onSaved(result.coverPath);
      return;
    }

    alert('Select a file or paste a valid link.');
  };

  const removeCover = async () => {
    if (game.coverPath) await window.launcher.removeCover({ coverPath: game.coverPath });
    await window.launcher.setGameCoverPath({
      emulator: game.emulator.name,
      romPath: game.romPath,
      coverPath: null,
    });
    onRemoved();
  };

  return (
    <div className="modal-bg" onMouseDown={(e) => e.target.classList.contains('modal-bg') && onClose()}>
      <div className="modal">
        <h2>Change cover: {getGameDisplayName(game)}</h2>
        <label className="field__label">Paste image link</label>
        <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
        <label className="field__label">Or choose a file</label>
        <div className="modal__file-row">
          <button className="btn btn--small" onClick={() => fileRef.current?.click()}>Choose file</button>
          <span className="muted">{file?.name || 'No file selected'}</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>
        {preview && <img className="modal__preview" src={preview} alt="Preview" />}
        <div className="modal__actions">
          <button className="btn btn--ghost" onClick={removeCover}>Remove cover</button>
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={saveCover}>Save cover</button>
        </div>
      </div>
    </div>
  );
}

function DiscModal({ game, discs, onClose, onLaunch }) {
  if (!game) return null;
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target.classList.contains('modal-bg') && onClose()}>
      <div className="modal">
        <h2>Choose disc for: {getGameDisplayName(game)}</h2>
        <ul className="disc-list">
          {discs.map((disc) => (
            <li key={disc.romPath}>
              <button onClick={() => onLaunch(disc)}>{disc.originalName || getGameDisplayName(disc)}</button>
            </li>
          ))}
        </ul>
        <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('library');
  const [config, setConfig] = useState(null);
  const [library, setLibrary] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortMode, setSortMode] = useState('alpha');
  const [selectedEmulatorId, setSelectedEmulatorId] = useState(null);
  const [selectedConsoleId, setSelectedConsoleId] = useState(null);
  const [collapseEmulators, setCollapseEmulators] = useState(false);
  const [collapseConsoles, setCollapseConsoles] = useState(false);

  const [contextMenu, setContextMenu] = useState(null);
  const [contextGame, setContextGame] = useState(null);
  const [renameGame, setRenameGame] = useState(null);
  const [coverGame, setCoverGame] = useState(null);
  const [discGame, setDiscGame] = useState(null);
  const [discList, setDiscList] = useState([]);

  useEffect(() => {
    if (!window.launcher) return;
    const disposeBootstrap = window.launcher.onBootstrap(({ config: cfg, library: lib }) => {
      setConfig(cfg);
      setLibrary(lib);
    });
    const disposeLibrary = window.launcher.onLibraryUpdated((lib) => setLibrary(lib));
    const disposeConfig = window.launcher.onConfigUpdated((cfg) => setConfig(cfg));
    return () => {
      disposeBootstrap?.();
      disposeLibrary?.();
      disposeConfig?.();
    };
  }, []);

  const emulators = library?.emulators || [];
  const selectedEmulator = emulators.find((e) => e.id === selectedEmulatorId) || null;
  const selectedConsole = selectedEmulator?.consoles?.find((c) => c.id === selectedConsoleId) || null;

  const { games, titleText, subtitleText } = useMemo(() => {
    let list = [];
    let title = 'Games';
    let subtitle = '';

    if (!selectedEmulatorId && !selectedConsoleId) {
      for (const emu of emulators) {
        for (const con of emu.consoles || []) {
          for (const game of con.games || []) {
            list.push({ ...game, emulator: { ...emu }, console: { ...con } });
          }
        }
      }
      title = 'All Games';
    } else if (selectedEmulatorId && !selectedConsoleId) {
      for (const con of selectedEmulator?.consoles || []) {
        for (const game of con.games || []) {
          list.push({ ...game, emulator: { ...selectedEmulator }, console: { ...con } });
        }
      }
      title = selectedEmulator?.name || 'Emulator';
    } else if (selectedEmulatorId && selectedConsoleId) {
      list = (selectedConsole?.games || []).map((game) => ({
        ...game,
        emulator: { ...selectedEmulator },
        console: { ...selectedConsole },
      }));
      title = selectedConsole?.name || 'Console';
    } else if (!selectedEmulatorId && selectedConsoleId) {
      for (const emu of emulators) {
        const con = (emu.consoles || []).find((c) => c.id === selectedConsoleId);
        if (con) {
          for (const game of con.games || []) {
            list.push({ ...game, emulator: { ...emu }, console: { ...con } });
          }
          title = con.name || 'Console';
          break;
        }
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((g) => getGameDisplayName(g).toLowerCase().includes(q));
    }

    if (statusFilter !== 'all') {
      list = list.filter((g) => (g.status || 'not_started') === statusFilter);
    }

    if (sortMode === 'emulator') {
      list.sort((a, b) => {
        const emu = (a.emulator?.name || '').localeCompare(b.emulator?.name || '');
        if (emu !== 0) return emu;
        const con = (a.console?.name || '').localeCompare(b.console?.name || '');
        if (con !== 0) return con;
        return getGameDisplayName(a).localeCompare(getGameDisplayName(b));
      });
    } else if (sortMode === 'console') {
      list.sort((a, b) => {
        const con = (a.console?.name || '').localeCompare(b.console?.name || '');
        if (con !== 0) return con;
        const emu = (a.emulator?.name || '').localeCompare(b.emulator?.name || '');
        if (emu !== 0) return emu;
        return getGameDisplayName(a).localeCompare(getGameDisplayName(b));
      });
    } else {
      list.sort((a, b) => getGameDisplayName(a).localeCompare(getGameDisplayName(b)));
    }

    subtitle = `${list.length} game(s) found`;

    return { games: list, titleText: title, subtitleText: subtitle };
  }, [emulators, selectedEmulator, selectedConsole, selectedEmulatorId, selectedConsoleId, searchQuery, statusFilter, sortMode]);

  const groupedGames = useMemo(() => {
    const grouped = {};
    for (const game of games) {
      const key = `${game.emulator.id}||${game.console.id}||${game.normalizedName || game.originalName}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(game);
    }
    return Object.values(grouped).map((group) => ({
      game: group[0],
      discs: group,
      isMultiDisc: group.length > 1,
    }));
  }, [games]);

  const allConsoles = useMemo(() => {
    if (selectedEmulatorId) return selectedEmulator?.consoles || [];
    const consoles = [];
    for (const emu of emulators) {
      for (const con of emu.consoles || []) consoles.push({ ...con, __emu: emu });
    }
    return consoles;
  }, [emulators, selectedEmulator, selectedEmulatorId]);

  const updateLibraryGame = (predicate, updater) => {
    setLibrary((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      for (const emu of next.emulators || []) {
        for (const con of emu.consoles || []) {
          for (const game of con.games || []) {
            if (predicate(game, emu, con)) updater(game, emu, con);
          }
        }
      }
      return next;
    });
  };

  const handleLaunch = async (game, discs) => {
    if (!window.launcher) return;
    if (discs?.length > 1) {
      setDiscGame(game);
      setDiscList(discs);
      return;
    }
    const result = await window.launcher.launchGame({
      emulatorId: game.emulator.id,
      consoleId: game.console.id,
      romPath: game.romPath,
    });
    if (!result?.ok) alert(result?.error || 'Failed to launch game');
  };

  const handleSetStatus = async (game, status) => {
    await window.launcher.setGameStatus({
      emulator: game.emulator.name,
      romPath: game.romPath,
      status,
    });
    updateLibraryGame(
      (g, emu, con) => emu.name === game.emulator.name && g.romPath === game.romPath,
      (g) => {
        g.status = status;
      }
    );
  };

  const handleRename = async (game, value) => {
    await window.launcher.setGameCustomName({
      emulator: game.emulator.name,
      romPath: game.romPath,
      customName: value,
    });
    updateLibraryGame(
      (g, emu, con) => emu.name === game.emulator.name && g.romPath === game.romPath,
      (g) => {
        g.customName = value;
      }
    );
    setRenameGame(null);
  };

  const handleCoverSaved = (game, coverPath) => {
    updateLibraryGame(
      (g, emu, con) => emu.name === game.emulator.name && g.romPath === game.romPath,
      (g) => {
        g.coverPath = coverPath;
      }
    );
    setCoverGame(null);
  };

  const handleCoverRemoved = (game) => {
    updateLibraryGame(
      (g, emu, con) => emu.name === game.emulator.name && g.romPath === game.romPath,
      (g) => {
        g.coverPath = null;
      }
    );
    setCoverGame(null);
  };

  const addEmulator = async () => window.launcher.addEmulator({ name: 'New Emulator', executablePath: '', launchArguments: '' });

  const addConsole = async () => {
    if (!selectedEmulatorId) return alert('Select an emulator first');
    await window.launcher.addConsole({ emulatorId: selectedEmulatorId, console: { name: 'New Console' } });
  };

  const configEmulators = config?.emulators || [];
  const configSelectedEmulator = configEmulators.find((e) => e.id === selectedEmulatorId) || null;
  const configSelectedConsole = configSelectedEmulator?.consoles?.find((c) => c.id === selectedConsoleId) || null;

  return (
    <div className="app" id="appRoot">
      <div className="app-background" />

      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__logo">🎮</span>
          <span className="topbar__title">Game Library</span>
        </div>

        <div className="topbar__search">
          <span className="topbar__search-icon">🔍</span>
          <input
            className="topbar__search-input"
            type="text"
            placeholder="Search your library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="topbar__actions">
          <button className="topbar__btn" title="Refresh Library" onClick={async () => window.launcher?.invoke('library:rescan')}>
            <span className="topbar__btn-icon">🔄</span>
            <span className="topbar__btn-text">Refresh</span>
          </button>
          <button className={`topbar__btn ${view === 'library' ? 'topbar__btn--active' : ''}`} title="Library" onClick={() => setView('library')}>
            <span className="topbar__btn-icon">📚</span>
            <span className="topbar__btn-text">Library</span>
          </button>
          <button className={`topbar__btn ${view === 'settings' ? 'topbar__btn--active' : ''}`} title="Settings" onClick={() => setView('settings')}>
            <span className="topbar__btn-icon">⚙️</span>
            <span className="topbar__btn-text">Settings</span>
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar" id="sidebar">
          <div className="sidebar__section">
            <div className="sidebar__section-header">
              <div className="sidebar__section-title">
                <span className="sidebar__section-icon">🎯</span>
                <span>Emulators</span>
              </div>
              <button className="sidebar__toggle" onClick={() => setCollapseEmulators((v) => !v)}>
                {collapseEmulators ? '▶' : '▼'}
              </button>
            </div>
            {!collapseEmulators && (
              <div className="sidebar__list">
                {emulators.map((emu) => (
                  <div
                    key={emu.id}
                    className={`item ${emu.id === selectedEmulatorId ? 'item--active' : ''}`}
                    onClick={() => {
                      if (selectedEmulatorId === emu.id) {
                        setSelectedEmulatorId(null);
                        setSelectedConsoleId(null);
                      } else {
                        setSelectedEmulatorId(emu.id);
                        setSelectedConsoleId(null);
                      }
                    }}
                  >
                    {emu.name || '(Unnamed emulator)'}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sidebar__section">
            <div className="sidebar__section-header">
              <div className="sidebar__section-title">
                <span className="sidebar__section-icon">🎮</span>
                <span>Consoles</span>
              </div>
              <button className="sidebar__toggle" onClick={() => setCollapseConsoles((v) => !v)}>
                {collapseConsoles ? '▶' : '▼'}
              </button>
            </div>
            {!collapseConsoles && (
              <div className="sidebar__list">
                {allConsoles.map((con) => (
                  <div
                    key={con.id}
                    className={`item ${con.id === selectedConsoleId ? 'item--active' : ''}`}
                    onClick={() => setSelectedConsoleId((prev) => (prev === con.id ? null : con.id))}
                  >
                    {con.name || '(Unnamed console)'}
                    {con.__emu ? <span className="sidebar__item-meta"> • {con.__emu.name}</span> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        <main className="main">
          {view === 'library' && (
            <section className="view view--active">
              <div className="library__header">
                <div className="library__title-section">
                  <h1 className="library__title">{titleText}</h1>
                  <p className="library__subtitle">{subtitleText}</p>
                </div>

                <div className="library__controls">
                  <div className="control-group">
                    <label className="control-label">Status</label>
                    <select className="control-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="all">All</option>
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="control-group">
                    <label className="control-label">Sort By</label>
                    <select className="control-select" value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
                      <option value="alpha">Alphabetical</option>
                      <option value="emulator">Emulator</option>
                      <option value="console">Console</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="game-grid">
                {groupedGames.map(({ game, discs, isMultiDisc }) => (
                  <div
                    key={`${game.emulator.id}-${game.console.id}-${game.romPath}`}
                    className="card"
                    onClick={() => handleLaunch(game, discs)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ x: e.clientX, y: e.clientY });
                      setContextGame(game);
                    }}
                  >
                    <div className="card__cover">
                      <CoverImage coverPath={game.coverPath} title={getGameDisplayName(game)} />
                    </div>
                    <div className="card__body">
                      <div className="card__title">{getGameDisplayName(game)}</div>
                      <div className="card__meta-col">
                        <div className={`card__status-bar card__status--${game.status || 'not_started'}`}>
                          {STATUS_OPTIONS.find((opt) => opt.value === (game.status || 'not_started'))?.label || 'Not Started'}
                          {isMultiDisc ? ' • Multi-Disc' : ''}
                        </div>
                        <div className="card__info-bar">
                          <span className="card__emulator-tag">{game.emulator?.name || ''}</span>
                          <span className="card__console-tag">{game.console?.name || ''}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {groupedGames.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state__icon">📭</div>
                  <div className="empty-state__title">No games found</div>
                  <div className="empty-state__text">Add ROM folders in Settings. The library updates automatically.</div>
                </div>
              )}
            </section>
          )}

          {view === 'settings' && (
            <section className="view view--active">
              <div className="settings settings--split">
                <div className="settings__col settings__col--left">
                  <div className="h2">Emulators & Consoles</div>
                  <div className="panel">
                    <div className="row">
                      <div className="h3">Emulators</div>
                      <button className="btn btn--small" onClick={addEmulator}>Add</button>
                    </div>
                    <div className="list">
                      {configEmulators.map((emu) => (
                        <div
                          key={emu.id}
                          className={`item ${emu.id === selectedEmulatorId ? 'item--active' : ''}`}
                          onClick={() => {
                            setSelectedEmulatorId(emu.id);
                            setSelectedConsoleId(emu.consoles?.[0]?.id || null);
                          }}
                        >
                          {emu.name || '(Unnamed emulator)'}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="panel">
                    <div className="row">
                      <div className="h3">Consoles</div>
                      <button className="btn btn--small" onClick={addConsole}>Add</button>
                    </div>
                    <div className="list">
                      {(configSelectedEmulator?.consoles || []).map((con) => (
                        <div
                          key={con.id}
                          className={`item ${con.id === selectedConsoleId ? 'item--active' : ''}`}
                          onClick={() => setSelectedConsoleId(con.id)}
                        >
                          {con.name || '(Unnamed console)'}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="settings__col settings__col--right">
                  <div className="panel">
                    <div className="row">
                      <div className="h3">Selected Emulator</div>
                    </div>
                    <div className="editor">
                      {configSelectedEmulator ? (
                        <>
                          <label className="field">
                            <div className="field__label">Name</div>
                            <input
                              className="input"
                              defaultValue={configSelectedEmulator.name || ''}
                              onBlur={(e) => window.launcher.updateEmulator({ ...configSelectedEmulator, name: e.target.value })}
                            />
                          </label>
                          <label className="field">
                            <div className="field__label">Executable Path</div>
                            <input
                              className="input"
                              defaultValue={configSelectedEmulator.executablePath || ''}
                              onBlur={(e) => window.launcher.updateEmulator({ ...configSelectedEmulator, executablePath: e.target.value })}
                            />
                            <div className="help">Use Pick .exe to browse.</div>
                          </label>
                          <button className="btn btn--small" onClick={async () => {
                            const exe = await window.launcher.pickExecutable();
                            if (exe) await window.launcher.updateEmulator({ ...configSelectedEmulator, executablePath: exe });
                          }}>Pick .exe</button>
                          <label className="field">
                            <div className="field__label">Launch Arguments (optional)</div>
                            <input
                              className="input"
                              defaultValue={configSelectedEmulator.launchArguments || ''}
                              onBlur={(e) => window.launcher.updateEmulator({ ...configSelectedEmulator, launchArguments: e.target.value })}
                            />
                          </label>
                          <button className="btn btn--ghost" onClick={async () => {
                            if (confirm('Delete this emulator and all its consoles?')) await window.launcher.deleteEmulator(configSelectedEmulator.id);
                          }}>Delete Emulator</button>
                        </>
                      ) : (
                        <div className="muted">Select an emulator to edit.</div>
                      )}
                    </div>
                  </div>

                  <div className="panel">
                    <div className="row">
                      <div className="h3">Selected Console</div>
                    </div>
                    <div className="editor">
                      {configSelectedEmulator && configSelectedConsole ? (
                        <>
                          <label className="field">
                            <div className="field__label">Name</div>
                            <input
                              className="input"
                              defaultValue={configSelectedConsole.name || ''}
                              onBlur={(e) => window.launcher.updateConsole({ emulatorId: configSelectedEmulator.id, console: { ...configSelectedConsole, name: e.target.value } })}
                            />
                          </label>

                          <div className="field">
                            <div className="field__label">ROM Folders</div>
                            <div className="list">
                              {(configSelectedConsole.romFolders || []).map((folder) => (
                                <div key={folder} className="item">
                                  <span>{folder}</span>
                                  <button className="btn btn--small btn--ghost" onClick={() => window.launcher.removeRomFolder({ emulatorId: configSelectedEmulator.id, consoleId: configSelectedConsole.id, folderPath: folder })}>Remove</button>
                                </div>
                              ))}
                            </div>
                            <button className="btn btn--small" onClick={async () => {
                              const folder = await window.launcher.pickFolder();
                              if (folder) await window.launcher.addRomFolder({ emulatorId: configSelectedEmulator.id, consoleId: configSelectedConsole.id, folderPath: folder });
                            }}>Add ROM Folder</button>
                          </div>

                          <div className="field">
                            <div className="field__label">Executables</div>
                            <div className="list">
                              {(configSelectedConsole.manualExecutables || []).map((exe) => (
                                <div key={exe} className="item">
                                  <span>{exe}</span>
                                  <button className="btn btn--small btn--ghost" onClick={() => {
                                    const next = (configSelectedConsole.manualExecutables || []).filter((x) => x !== exe);
                                    window.launcher.updateConsole({ emulatorId: configSelectedEmulator.id, console: { ...configSelectedConsole, manualExecutables: next } });
                                  }}>Remove</button>
                                </div>
                              ))}
                            </div>
                            <button className="btn btn--small" onClick={async () => {
                              const exe = await window.launcher.pickExecutable(['exe', 'bat']);
                              if (exe) {
                                const next = Array.from(new Set([...(configSelectedConsole.manualExecutables || []), exe]));
                                await window.launcher.updateConsole({ emulatorId: configSelectedEmulator.id, console: { ...configSelectedConsole, manualExecutables: next } });
                              }
                            }}>Add Executable (.exe or .bat)</button>
                          </div>

                          <button className="btn btn--ghost" onClick={async () => {
                            if (confirm('Delete this console?')) await window.launcher.deleteConsole({ emulatorId: configSelectedEmulator.id, consoleId: configSelectedConsole.id });
                          }}>Delete Console</button>
                        </>
                      ) : (
                        <div className="muted">Select an emulator and console to edit.</div>
                      )}
                    </div>
                  </div>

                  <button className="btn btn--danger" onClick={async () => {
                    const result = await window.launcher.invoke('cover:removeOrphans');
                    if (result?.ok) alert(`Removed ${result.removed} orphan covers.`);
                    else alert('Error removing covers: ' + (result?.error || 'Unknown error'));
                  }}>Remove orphan covers</button>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      <ContextMenu
        position={contextMenu}
        onClose={() => {
          setContextMenu(null);
          setContextGame(null);
        }}
        onRename={() => {
          setRenameGame(contextGame);
          setContextMenu(null);
        }}
        onCover={() => {
          setCoverGame(contextGame);
          setContextMenu(null);
        }}
        onSetStatus={(status) => {
          handleSetStatus(contextGame, status);
          setContextMenu(null);
        }}
      />

      {renameGame && (
        <RenameModal
          game={renameGame}
          onClose={() => setRenameGame(null)}
          onSave={(value) => handleRename(renameGame, value)}
        />
      )}

      {coverGame && (
        <CoverModal
          game={coverGame}
          onClose={() => setCoverGame(null)}
          onSaved={(coverPath) => handleCoverSaved(coverGame, coverPath)}
          onRemoved={() => handleCoverRemoved(coverGame)}
        />
      )}

      {discGame && (
        <DiscModal
          game={discGame}
          discs={discList}
          onClose={() => {
            setDiscGame(null);
            setDiscList([]);
          }}
          onLaunch={async (disc) => {
            await handleLaunch(disc, [disc]);
            setDiscGame(null);
            setDiscList([]);
          }}
        />
      )}
    </div>
  );
}
