import React, { useContext, useState, useEffect, useRef } from 'react';
import { X, Music } from 'lucide-react';
import { PlayerContext } from '../context/PlayerContext';

const CustomModal = () => {
  // Read userPlaylists and user LIVE from context — never stale
  const { modalConfig, userPlaylists, user, setActiveView } = useContext(PlayerContext);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (modalConfig) {
      if (modalConfig.type === 'prompt') {
        setInputValue(modalConfig.defaultValue || '');
      }
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [modalConfig]);

  if (!modalConfig) return null;

  const handleConfirm = () => {
    if (modalConfig.type === 'prompt') {
      modalConfig.onConfirm(inputValue);
    } else {
      modalConfig.onConfirm();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleConfirm(); }
    else if (e.key === 'Escape') { e.preventDefault(); modalConfig.onCancel(); }
  };

  const playlists = userPlaylists || [];

  return (
    <div className="custom-modal-overlay" onClick={modalConfig.onCancel}>
      <div className="custom-modal-card" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="custom-modal-header">
            <h3>{modalConfig.title}</h3>
          </div>
          <button
            onClick={modalConfig.onCancel}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
              padding: '4px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Confirm / Prompt body message ── */}
        {modalConfig.message && modalConfig.type !== 'selectPlaylist' && (
          <div className="custom-modal-body">{modalConfig.message}</div>
        )}

        {/* ── Prompt: text input ── */}
        {modalConfig.type === 'prompt' && (
          <input
            ref={inputRef}
            type="text"
            className="custom-modal-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={modalConfig.placeholder || 'Type here...'}
          />
        )}

        {/* ── Select Playlist: live list from context ── */}
        {modalConfig.type === 'selectPlaylist' && (
          <div>
            {modalConfig.message && (
              <div className="custom-modal-body" style={{ marginBottom: '14px', fontSize: '13px' }}>
                {modalConfig.message}
              </div>
            )}
            <div className="modal-playlists-grid">
              {playlists.length > 0 ? (
                playlists.map(playlist => (
                  <div
                    key={playlist.id}
                    className="modal-playlist-option"
                    onClick={() => modalConfig.onConfirm(playlist.id)}
                  >
                    {playlist.image ? (
                      <img src={playlist.image} alt={playlist.name} className="modal-playlist-thumb" />
                    ) : (
                      <div className="modal-playlist-thumb" style={{
                        background: 'rgba(129,140,248,0.15)',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', borderRadius: '6px'
                      }}>
                        <Music size={18} color="var(--accent-primary)" />
                      </div>
                    )}
                    <div>
                      <div className="modal-playlist-name">{playlist.name}</div>
                      <div className="modal-playlist-songs">{playlist.songs?.length || 0} songs</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{
                  color: 'var(--text-subdued)', padding: '28px 16px',
                  fontSize: '14px', textAlign: 'center', lineHeight: '1.8'
                }}>
                  <Music size={36} style={{ opacity: 0.25, display: 'block', margin: '0 auto 12px' }} />
                  {!user || user.isAnonymous ? (
                    <>
                      <strong style={{ color: 'white', fontSize: '15px', display: 'block', marginBottom: '6px' }}>
                        Sign in to use Playlists
                      </strong>
                      <span style={{ fontSize: '12px', opacity: 0.65 }}>
                        Create an account to save songs and build your library.
                      </span>
                      <button
                        onClick={() => { modalConfig.onCancel(); setActiveView('auth'); }}
                        style={{
                          marginTop: '18px', display: 'block', width: '100%',
                          padding: '11px', borderRadius: '24px',
                          background: 'var(--accent-primary)', border: 'none',
                          color: 'white', fontWeight: '700', fontSize: '14px',
                          cursor: 'pointer', boxShadow: '0 4px 15px var(--accent-glow)'
                        }}
                      >
                        Sign In / Create Account
                      </button>
                    </>
                  ) : (
                    <>
                      <strong style={{ color: 'white', fontSize: '15px', display: 'block', marginBottom: '6px' }}>
                        No playlists yet
                      </strong>
                      <span style={{ fontSize: '12px', opacity: 0.65 }}>
                        Click the <strong style={{ color: 'var(--accent-primary)' }}>+</strong> in Your Library to create your first playlist.
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Action buttons (prompt / confirm only) ── */}
        {modalConfig.type !== 'selectPlaylist' && (
          <div className="custom-modal-actions">
            <button className="custom-modal-btn cancel" onClick={modalConfig.onCancel}>
              {modalConfig.cancelText || 'Cancel'}
            </button>
            <button
              className={`custom-modal-btn ${modalConfig.confirmText === 'Delete' ? 'danger' : 'confirm'}`}
              onClick={handleConfirm}
            >
              {modalConfig.confirmText || 'Confirm'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default CustomModal;
