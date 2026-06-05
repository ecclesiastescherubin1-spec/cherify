import React, { useContext, useState, useEffect, useRef } from 'react';
import { X, Music } from 'lucide-react';
import { PlayerContext } from '../context/PlayerContext';

const CustomModal = () => {
  const { modalConfig } = useContext(PlayerContext);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (modalConfig) {
      if (modalConfig.type === 'prompt') {
        setInputValue(modalConfig.defaultValue || '');
      }
      // Auto-focus input
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
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      modalConfig.onCancel();
    }
  };

  return (
    <div className="custom-modal-overlay" onClick={modalConfig.onCancel}>
      <div className="custom-modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div className="custom-modal-header">
            <h3>{modalConfig.title}</h3>
          </div>
          <button 
            onClick={modalConfig.onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
          >
            <X size={20} />
          </button>
        </div>

        {modalConfig.message && modalConfig.type !== 'selectPlaylist' && (
          <div className="custom-modal-body">
            {modalConfig.message}
          </div>
        )}

        {modalConfig.type === 'prompt' && (
          <div>
            <input
              ref={inputRef}
              type="text"
              className="custom-modal-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={modalConfig.placeholder || "Type here..."}
            />
          </div>
        )}

        {modalConfig.type === 'selectPlaylist' && (
          <div>
            {modalConfig.message && (
              <div className="custom-modal-body" style={{ marginBottom: '12px' }}>
                {modalConfig.message}
              </div>
            )}
            <div className="modal-playlists-grid">
              {modalConfig.options && modalConfig.options.length > 0 ? (
                modalConfig.options.map(playlist => (
                  <div 
                    key={playlist.id} 
                    className="modal-playlist-option"
                    onClick={() => modalConfig.onConfirm(playlist.id)}
                  >
                    {playlist.image ? (
                      <img src={playlist.image} alt={playlist.name} className="modal-playlist-thumb" />
                    ) : (
                      <div className="modal-playlist-thumb" style={{ background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Music size={18} color="var(--accent-primary)" />
                      </div>
                    )}
                    <div style={{ textAlign: 'left' }}>
                      <div className="modal-playlist-name">{playlist.name}</div>
                      <div className="modal-playlist-songs">
                        {playlist.songs?.length || 0} songs
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-subdued)', padding: '20px 0', fontSize: '14px', textAlign: 'center' }}>
                  You don't have any playlists yet.
                </div>
              )}
            </div>
          </div>
        )}

        {modalConfig.type !== 'selectPlaylist' && (
          <div className="custom-modal-actions">
            <button 
              className="custom-modal-btn cancel" 
              onClick={modalConfig.onCancel}
            >
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
