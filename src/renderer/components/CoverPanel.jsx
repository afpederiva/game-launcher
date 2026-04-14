import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Image } from 'lucide-react';

export default function CoverPanel({ game, isOpen, onClose, onSave }) {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setFile(null);
    setUrl('');
    setPreview('');
  }, [isOpen]);

  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setPreview(String(event.target?.result || ''));
    reader.readAsDataURL(file);
  }, [file]);

  const canSave = Boolean(file || url.trim());

  const previewUrl = useMemo(() => {
    if (preview) return preview;
    if (url.trim()) return url.trim();
    return '';
  }, [preview, url]);

  if (!isOpen) return null;

  return (
    <motion.aside
      initial={{ x: 420, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 420, opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      style={{
        position: 'fixed',
        top: 64,
        right: 0,
        bottom: 0,
        width: 420,
        backgroundColor: '#0b0e14',
        borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
        zIndex: 45,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#151923',
        color: '#e6e6eb',
      }}>
        <div>
          <div style={{ fontWeight: 700 }}>Cover</div>
          <div style={{ fontSize: 12, color: '#9aa0b3' }}>{game?.originalName || game?.normalizedName}</div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            border: '1px solid rgba(255, 255, 255, 0.06)',
            backgroundColor: '#1c2130',
            color: '#9aa0b3',
            cursor: 'pointer',
          }}
          aria-label="Close cover"
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, color: '#e6e6eb', flex: 1, overflow: 'auto' }}>
        <section style={{
          backgroundColor: '#151923',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 12,
          padding: 12,
        }}>
          <div style={{ fontSize: 12, color: '#9aa0b3', textTransform: 'uppercase', marginBottom: 8 }}>Upload file</div>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            style={{ color: '#9aa0b3' }}
          />
        </section>

        <section style={{
          backgroundColor: '#151923',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 12,
          padding: 12,
        }}>
          <div style={{ fontSize: 12, color: '#9aa0b3', textTransform: 'uppercase', marginBottom: 8 }}>Paste URL</div>
          <input
            type="text"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://..."
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 10,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: '#1c2130',
              color: '#e6e6eb',
            }}
          />
          <div style={{ fontSize: 11, color: '#9aa0b3', marginTop: 6 }}>
            The link is downloaded and saved locally.
          </div>
        </section>

        <section style={{
          backgroundColor: '#151923',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 12,
          padding: 12,
        }}>
          <div style={{ fontSize: 12, color: '#9aa0b3', textTransform: 'uppercase', marginBottom: 8 }}>Preview</div>
          <div style={{
            width: '100%',
            aspectRatio: '2 / 3',
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: '#0b0e14',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}>
            {previewUrl ? (
              <img src={previewUrl} alt="Cover preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9aa0b3',
                gap: 6,
              }}>
                <Image size={20} />
                <span style={{ fontSize: 12 }}>No preview</span>
              </div>
            )}
          </div>
        </section>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onSave({ file, url: url.trim() })}
            disabled={!canSave}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 10,
              border: 'none',
              backgroundColor: canSave ? '#7c7cff' : 'rgba(124, 124, 255, 0.3)',
              color: 'white',
              cursor: canSave ? 'pointer' : 'not-allowed',
            }}
          >
            Save cover
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: '#1c2130',
              color: '#9aa0b3',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
