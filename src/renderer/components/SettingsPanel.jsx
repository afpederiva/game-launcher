import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, FolderOpen, FileDown } from 'lucide-react';

export default function SettingsPanel({ isOpen, config, onClose, coverDisplay, onCoverDisplayChange }) {
  const palette = {
    bgPrimary: '#0b0e14',
    bgSecondary: '#151923',
    bgTertiary: '#1c2130',
    textPrimary: '#e6e6eb',
    textSecondary: '#9aa0b3',
    border: 'rgba(255, 255, 255, 0.05)',
    accentPurple: '#7c7cff',
    accentBlue: '#4cc2ff',
  };

  const emulators = useMemo(() => config?.emulators || [], [config]);
  const [selectedEmulatorId, setSelectedEmulatorId] = useState(null);
  const [selectedConsoleId, setSelectedConsoleId] = useState(null);
  const [emulatorForm, setEmulatorForm] = useState({ name: '', executablePath: '', launchArguments: '' });
  const [consoleName, setConsoleName] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (!emulators.length) {
      setSelectedEmulatorId(null);
      setSelectedConsoleId(null);
      return;
    }
    setSelectedEmulatorId((prev) => (emulators.some((e) => e.id === prev) ? prev : emulators[0].id));
  }, [isOpen, emulators]);

  const selectedEmulator = emulators.find((e) => e.id === selectedEmulatorId) || null;
  const consoles = selectedEmulator?.consoles || [];

  useEffect(() => {
    if (!isOpen) return;
    if (!consoles.length) {
      setSelectedConsoleId(null);
      return;
    }
    setSelectedConsoleId((prev) => (consoles.some((c) => c.id === prev) ? prev : consoles[0].id));
  }, [isOpen, selectedEmulatorId, consoles]);

  const selectedConsole = consoles.find((c) => c.id === selectedConsoleId) || null;

  useEffect(() => {
    if (!selectedEmulator) {
      setEmulatorForm({ name: '', executablePath: '', launchArguments: '' });
      return;
    }
    setEmulatorForm({
      name: selectedEmulator.name || '',
      executablePath: selectedEmulator.executablePath || '',
      launchArguments: selectedEmulator.launchArguments || '',
    });
  }, [selectedEmulator]);

  useEffect(() => {
    if (!selectedConsole) {
      setConsoleName('');
      return;
    }
    setConsoleName(selectedConsole.name || '');
  }, [selectedConsole]);

  const handleAddEmulator = async () => {
    if (!window.launcher) return;
    await window.launcher.addEmulator({ name: 'New Emulator', executablePath: '', launchArguments: '' });
  };

  const handleAddConsole = async () => {
    if (!window.launcher) return;
    if (!selectedEmulator) {
      alert('Select an emulator first.');
      return;
    }
    await window.launcher.addConsole({ emulatorId: selectedEmulator.id, console: { name: 'New Console' } });
  };

  const handleRescan = async () => {
    if (!window.launcher) return;
    await window.launcher.invoke('library:rescan');
  };

  const handleRemoveOrphans = async () => {
    if (!window.launcher) return;
    const result = await window.launcher.invoke('cover:removeOrphans');
    if (result?.ok) alert(`Removed ${result.removed} orphan covers.`);
    else alert(`Error removing covers: ${result?.error || 'Unknown error'}`);
  };

  if (!isOpen) return null;

  return (
    <motion.aside
      initial={{ x: 640, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 640, opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      style={{
        position: 'fixed',
        top: 64,
        right: 0,
        bottom: 0,
        width: 640,
        backgroundColor: palette.bgPrimary,
        borderLeft: `1px solid ${palette.border}`,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{
        padding: '16px 20px',
        borderBottom: `1px solid ${palette.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: palette.bgSecondary,
      }}>
        <div>
          <div style={{ fontWeight: 700, color: palette.textPrimary }}>Settings</div>
          <div style={{ fontSize: 12, color: palette.textSecondary }}>Manage emulators, consoles and ROM folders</div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            border: `1px solid ${palette.border}`,
            backgroundColor: palette.bgTertiary,
            color: palette.textSecondary,
            cursor: 'pointer',
          }}
          aria-label="Close settings"
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: 16, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        <section style={{
          backgroundColor: palette.bgSecondary,
          border: `1px solid ${palette.border}`,
          borderRadius: 12,
          padding: 12,
        }}>
          <div style={{ fontSize: 12, color: palette.textSecondary, textTransform: 'uppercase', marginBottom: 8 }}>Cover display</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['contain', 'cover'].map((mode) => (
              <button
                key={mode}
                onClick={() => onCoverDisplayChange?.(mode)}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: `1px solid ${palette.border}`,
                  backgroundColor: coverDisplay === mode ? 'rgba(124, 124, 255, 0.2)' : palette.bgTertiary,
                  color: coverDisplay === mode ? palette.accentPurple : palette.textSecondary,
                  cursor: 'pointer',
                }}
              >
                {mode === 'contain' ? 'No crop' : 'Fill'}
              </button>
            ))}
          </div>
        </section>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(200px, 1fr) minmax(260px, 1.4fr)',
          gap: 12,
        }}>
          <section style={{
            backgroundColor: palette.bgSecondary,
            border: `1px solid ${palette.border}`,
            borderRadius: 12,
            padding: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: palette.textSecondary, textTransform: 'uppercase' }}>Emulators</div>
              <button
                onClick={handleAddEmulator}
                style={{
                  fontSize: 12,
                  padding: '4px 8px',
                  borderRadius: 8,
                  backgroundColor: 'rgba(124, 124, 255, 0.2)',
                  color: palette.accentPurple,
                  border: `1px solid rgba(124, 124, 255, 0.3)`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Plus size={14} /> Add
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {emulators.length === 0 && (
                <div style={{ fontSize: 12, color: palette.textSecondary }}>No emulators yet.</div>
              )}
              {emulators.map((emu) => (
                <button
                  key={emu.id}
                  onClick={() => setSelectedEmulatorId(emu.id)}
                  style={{
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: `1px solid ${palette.border}`,
                    backgroundColor: selectedEmulatorId === emu.id ? 'rgba(124, 124, 255, 0.18)' : palette.bgTertiary,
                    color: selectedEmulatorId === emu.id ? palette.accentPurple : palette.textSecondary,
                    cursor: 'pointer',
                  }}
                >
                  {emu.name || '(Unnamed emulator)'}
                </button>
              ))}
            </div>
          </section>

          <section style={{
            backgroundColor: palette.bgSecondary,
            border: `1px solid ${palette.border}`,
            borderRadius: 12,
            padding: 12,
          }}>
            <div style={{ fontSize: 12, color: palette.textSecondary, textTransform: 'uppercase', marginBottom: 8 }}>Selected emulator</div>
            {selectedEmulator ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ fontSize: 11, color: palette.textSecondary }}>
                  Name
                  <input
                    value={emulatorForm.name}
                    onChange={(e) => setEmulatorForm((prev) => ({ ...prev, name: e.target.value }))}
                    onBlur={(e) => window.launcher?.updateEmulator({ ...selectedEmulator, name: e.target.value })}
                    style={{
                      width: '100%',
                      marginTop: 6,
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: `1px solid ${palette.border}`,
                      backgroundColor: palette.bgTertiary,
                      color: palette.textPrimary,
                    }}
                  />
                </label>
                <label style={{ fontSize: 11, color: palette.textSecondary }}>
                  Executable Path
                  <input
                    value={emulatorForm.executablePath}
                    onChange={(e) => setEmulatorForm((prev) => ({ ...prev, executablePath: e.target.value }))}
                    onBlur={(e) => window.launcher?.updateEmulator({ ...selectedEmulator, executablePath: e.target.value })}
                    style={{
                      width: '100%',
                      marginTop: 6,
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: `1px solid ${palette.border}`,
                      backgroundColor: palette.bgTertiary,
                      color: palette.textPrimary,
                    }}
                  />
                </label>
                <button
                  onClick={async () => {
                    const exe = await window.launcher?.pickExecutable();
                    if (exe) {
                      setEmulatorForm((prev) => ({ ...prev, executablePath: exe }));
                      await window.launcher?.updateEmulator({ ...selectedEmulator, executablePath: exe });
                    }
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: `1px solid ${palette.border}`,
                    backgroundColor: palette.bgTertiary,
                    color: palette.textSecondary,
                    cursor: 'pointer',
                  }}
                >
                  Pick .exe
                </button>
                <label style={{ fontSize: 11, color: palette.textSecondary }}>
                  Launch Arguments (optional)
                  <input
                    value={emulatorForm.launchArguments}
                    onChange={(e) => setEmulatorForm((prev) => ({ ...prev, launchArguments: e.target.value }))}
                    onBlur={(e) => window.launcher?.updateEmulator({ ...selectedEmulator, launchArguments: e.target.value })}
                    style={{
                      width: '100%',
                      marginTop: 6,
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: `1px solid ${palette.border}`,
                      backgroundColor: palette.bgTertiary,
                      color: palette.textPrimary,
                    }}
                  />
                </label>
                <button
                  onClick={async () => {
                    if (!window.launcher) return;
                    if (confirm('Delete this emulator and all its consoles?')) {
                      await window.launcher.deleteEmulator(selectedEmulator.id);
                    }
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    color: '#fca5a5',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={14} style={{ marginRight: 6 }} /> Delete Emulator
                </button>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: palette.textSecondary }}>Select an emulator to edit.</div>
            )}
          </section>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(200px, 1fr) minmax(260px, 1.4fr)',
          gap: 12,
        }}>
          <section style={{
            backgroundColor: palette.bgSecondary,
            border: `1px solid ${palette.border}`,
            borderRadius: 12,
            padding: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: palette.textSecondary, textTransform: 'uppercase' }}>Consoles</div>
              <button
                onClick={handleAddConsole}
                style={{
                  fontSize: 12,
                  padding: '4px 8px',
                  borderRadius: 8,
                  backgroundColor: 'rgba(76, 194, 255, 0.2)',
                  color: palette.accentBlue,
                  border: `1px solid rgba(76, 194, 255, 0.3)`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Plus size={14} /> Add
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {!selectedEmulator && (
                <div style={{ fontSize: 12, color: palette.textSecondary }}>Select an emulator to view consoles.</div>
              )}
              {selectedEmulator && consoles.length === 0 && (
                <div style={{ fontSize: 12, color: palette.textSecondary }}>No consoles yet.</div>
              )}
              {consoles.map((con) => {
                const active = selectedConsoleId === con.id;
                return (
                  <button
                    key={con.id}
                    onClick={() => setSelectedConsoleId(con.id)}
                    style={{
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: `1px solid ${palette.border}`,
                      backgroundColor: active ? 'rgba(76, 194, 255, 0.18)' : palette.bgTertiary,
                      color: active ? palette.accentBlue : palette.textSecondary,
                      cursor: 'pointer',
                    }}
                  >
                    {con.name || '(Unnamed console)'}
                  </button>
                );
              })}
            </div>
          </section>

          <section style={{
            backgroundColor: palette.bgSecondary,
            border: `1px solid ${palette.border}`,
            borderRadius: 12,
            padding: 12,
          }}>
            <div style={{ fontSize: 12, color: palette.textSecondary, textTransform: 'uppercase', marginBottom: 8 }}>Selected console</div>
            {selectedEmulator && selectedConsole ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ fontSize: 11, color: palette.textSecondary }}>
                  Name
                  <input
                    value={consoleName}
                    onChange={(e) => setConsoleName(e.target.value)}
                    onBlur={(e) => window.launcher?.updateConsole({ emulatorId: selectedEmulator.id, console: { ...selectedConsole, name: e.target.value } })}
                    style={{
                      width: '100%',
                      marginTop: 6,
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: `1px solid ${palette.border}`,
                      backgroundColor: palette.bgTertiary,
                      color: palette.textPrimary,
                    }}
                  />
                </label>

              <div style={{ fontSize: 11, color: palette.textSecondary }}>
                ROM folders
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                  {(selectedConsole.romFolders || []).map((folder) => (
                    <div key={folder} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: 8,
                      border: `1px solid ${palette.border}`,
                      backgroundColor: palette.bgTertiary,
                      color: palette.textPrimary,
                      fontSize: 11,
                    }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{folder}</span>
                      <button
                        onClick={() => window.launcher?.removeRomFolder({ emulatorId: selectedEmulator.id, consoleId: selectedConsole.id, folderPath: folder })}
                        style={{ color: palette.textSecondary, background: 'transparent', border: 'none', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {(selectedConsole.romFolders || []).length === 0 && (
                    <div style={{ fontSize: 12, color: palette.textSecondary }}>No ROM folders yet.</div>
                  )}
                </div>
                <button
                  onClick={async () => {
                    const folder = await window.launcher?.pickFolder();
                    if (folder) await window.launcher?.addRomFolder({ emulatorId: selectedEmulator.id, consoleId: selectedConsole.id, folderPath: folder });
                  }}
                  style={{
                    marginTop: 8,
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: `1px solid ${palette.border}`,
                    backgroundColor: palette.bgTertiary,
                    color: palette.textSecondary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <FolderOpen size={14} /> Add ROM Folder
                </button>
              </div>

              <div style={{ fontSize: 11, color: palette.textSecondary }}>
                Executables
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                  {(selectedConsole.manualExecutables || []).map((exe) => (
                    <div key={exe} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: 8,
                      border: `1px solid ${palette.border}`,
                      backgroundColor: palette.bgTertiary,
                      color: palette.textPrimary,
                      fontSize: 11,
                    }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{exe}</span>
                      <button
                        onClick={() => {
                          const next = (selectedConsole.manualExecutables || []).filter((x) => x !== exe);
                          window.launcher?.updateConsole({ emulatorId: selectedEmulator.id, console: { ...selectedConsole, manualExecutables: next } });
                        }}
                        style={{ color: palette.textSecondary, background: 'transparent', border: 'none', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {(selectedConsole.manualExecutables || []).length === 0 && (
                    <div style={{ fontSize: 12, color: palette.textSecondary }}>No executables yet.</div>
                  )}
                </div>
                <button
                  onClick={async () => {
                    const exe = await window.launcher?.pickExecutable(['exe', 'bat']);
                    if (exe) {
                      const next = Array.from(new Set([...(selectedConsole.manualExecutables || []), exe]));
                      await window.launcher?.updateConsole({ emulatorId: selectedEmulator.id, console: { ...selectedConsole, manualExecutables: next } });
                    }
                  }}
                  style={{
                    marginTop: 8,
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: `1px solid ${palette.border}`,
                    backgroundColor: palette.bgTertiary,
                    color: palette.textSecondary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <FileDown size={14} /> Add Executable (.exe or .bat)
                </button>
              </div>

              <button
                onClick={async () => {
                  if (!window.launcher) return;
                  if (confirm('Delete this console?')) {
                    await window.launcher.deleteConsole({ emulatorId: selectedEmulator.id, consoleId: selectedConsole.id });
                  }
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#fca5a5',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={14} style={{ marginRight: 6 }} /> Delete Console
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: palette.textSecondary }}>Select an emulator and console to edit.</div>
          )}
        </section>
        </div>

        <section style={{
          backgroundColor: palette.bgSecondary,
          border: `1px solid ${palette.border}`,
          borderRadius: 12,
          padding: 12,
          display: 'flex',
          gap: 8,
        }}>
          <button
            onClick={handleRescan}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 10,
              border: `1px solid ${palette.border}`,
              backgroundColor: palette.bgTertiary,
              color: palette.textSecondary,
              cursor: 'pointer',
            }}
          >
            Rescan Library
          </button>
          <button
            onClick={handleRemoveOrphans}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 10,
              border: `1px solid ${palette.border}`,
              backgroundColor: palette.bgTertiary,
              color: palette.textSecondary,
              cursor: 'pointer',
            }}
          >
            Remove Orphan Covers
          </button>
        </section>
      </div>
    </motion.aside>
  );
}
