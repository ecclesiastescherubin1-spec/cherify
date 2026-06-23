import { useContext, useState, useEffect } from 'react';
import { PlayerContext } from '../context/PlayerContext';
import { Camera, Save, LogOut, User as UserIcon } from 'lucide-react';

const ProfileView = () => {
  const { user, updateUserProfile, logout, setActiveView } = useContext(PlayerContext);
  const [name, setName] = useState(user?.name || '');
  const [img, setImg] = useState(user?.profileImg || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setImg(user.profileImg || '');
    }
  }, [user]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const tempImg = new Image();
        tempImg.onload = () => {
          const canvas = document.createElement('canvas');
          const max_size = 400; // max size in pixels
          let width = tempImg.width;
          let height = tempImg.height;
          
          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(tempImg, 0, 0, width, height);
          
          // Export as JPEG at 0.7 quality to keep size tiny (10-30KB)
          const compressed = canvas.toDataURL('image/jpeg', 0.7);
          setImg(compressed);
        };
        tempImg.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await updateUserProfile({ name, profileImg: img });
      setActiveView('home');
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2 className="profile-title">Your Profile</h2>
        
        <div className="profile-avatar-section">
          <div className="avatar-wrapper">
            {img ? <img src={img} alt="Profile" /> : <UserIcon size={64} />}
            <label className="avatar-upload-btn">
              <Camera size={20} />
              <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
            </label>
          </div>
        </div>

        <div className="profile-form">
          <div className="input-group">
            <span className="input-label">Display Name</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          
          {user?.id !== 'guest' && (
            <div className="input-group">
              <span className="input-label">Email Address</span>
              <input type="text" value={user?.email} disabled style={{ opacity: 0.5 }} />
            </div>
          )}

          <div className="profile-actions">
            <button className="btn-save" onClick={handleSave} disabled={isSaving} style={{ opacity: isSaving ? 0.7 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}>
              <Save size={20} /> {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button className="btn-logout" onClick={() => { logout(); setActiveView('home'); }}>
              <LogOut size={20} /> Sign Out
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .profile-container {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 40px;
        }
        .profile-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          padding: 48px;
          border-radius: 32px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          width: 100%;
          max-width: 500px;
          animation: fadeInUp 0.8s ease-out;
        }
        .profile-title {
          font-family: 'Syne', sans-serif;
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 32px;
          text-align: center;
        }
        .profile-avatar-section {
          display: flex;
          justify-content: center;
          margin-bottom: 32px;
        }
        .avatar-wrapper {
          position: relative;
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--glass-border);
        }
        .avatar-wrapper img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
        .avatar-upload-btn {
          position: absolute;
          bottom: 0;
          right: 0;
          background: var(--accent-primary);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 3px solid #16161a;
        }
        .avatar-upload-btn:hover {
          transform: scale(1.1);
        }
        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .input-label {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-subdued);
          letter-spacing: 0.05em;
        }
        .input-group input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 12px 16px;
          color: white;
          font-family: inherit;
          font-size: 16px;
        }
        .profile-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 16px;
        }
        .btn-save {
          background: white;
          color: black;
          padding: 14px;
          border-radius: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
        }
        .btn-save:hover {
          transform: translateY(-2px);
        }
        .btn-logout {
          background: rgba(233, 20, 41, 0.1);
          color: #e91429;
          padding: 14px;
          border-radius: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
        }
        .btn-logout:hover {
          background: rgba(233, 20, 41, 0.2);
        }
      `}} />
    </div>
  );
};

export default ProfileView;
