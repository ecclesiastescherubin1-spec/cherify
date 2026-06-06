import { useContext, useState } from 'react';
import { PlayerContext } from '../context/PlayerContext';
import { Music, Mail, Lock, User, ArrowRight, Check, ShieldCheck, ArrowLeft } from 'lucide-react';

const Welcome = () => {
  const { setShowWelcome, setPreferredArtists, preferredArtists, login, register, updateUserProfile, user, loginAnonymously, resetPassword, showToast } = useContext(PlayerContext);
  const [stage, setStage] = useState('intro'); // 'intro', 'auth', 'artists', 'forgot', 'reset-success', 'otp', 'new-password'
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [isFinishing, setIsFinishing] = useState(false);

  const handleStart = async () => {
    setIsFinishing(true);
    localStorage.setItem('hasSeenWelcome', 'true');
    
    let currentUser = user;
    // Proceed as local guest
    if (!currentUser) {
      console.log("Proceeding as local guest");
    }

    if (currentUser) {
      await updateUserProfile({ preferredArtists });
    }
    
    // Small delay to ensure state propagates
    setTimeout(() => {
      setShowWelcome(false);
      setIsFinishing(false);
    }, 500);
  };

  const globalArtists = [
    { id: '615155', name: 'The Weeknd', lang: 'English', img: 'https://c.saavncdn.com/artists/The_Weeknd_002_20241003071400_500x500.jpg' },
    { id: '565990', name: 'Taylor Swift', lang: 'English', img: 'https://c.saavncdn.com/artists/Taylor_Swift_003_20200226074119_500x500.jpg' },
    { id: '512453', name: 'Drake', lang: 'English', img: 'https://c.saavncdn.com/artists/Drake_005_20220704120432_500x500.jpg' },
    { id: '1274170', name: 'Dua Lipa', lang: 'English', img: 'https://c.saavncdn.com/artists/Dua_Lipa_004_20231120090922_500x500.jpg' },
    { id: '455663', name: 'Anirudh', lang: 'Tamil', img: 'https://c.saavncdn.com/artists/Anirudh_Ravichander_003_20260121134149_500x500.jpg' },
    { id: '456269', name: 'A.R. Rahman', lang: 'Tamil', img: 'https://c.saavncdn.com/artists/AR_Rahman_002_20210120084455_500x500.jpg' },
    { id: '689580', name: 'Sid Sriram', lang: 'Tamil', img: 'https://c.saavncdn.com/artists/Sid_Sriram_005_20240425180600_500x500.jpg' },
    { id: '468245', name: 'Diljit Dosanjh', lang: 'Punjabi', img: 'https://c.saavncdn.com/artists/Diljit_Dosanjh_005_20231025073054_500x500.jpg' },
    { id: '459320', name: 'Arijit Singh', lang: 'Hindi', img: 'https://c.saavncdn.com/artists/Arijit_Singh_004_20241118063717_500x500.jpg' },
    { id: '2029479', name: 'Bad Bunny', lang: 'Spanish', img: 'https://c.saavncdn.com/artists/Bad_Bunny_001_20250207055513_500x500.jpg' },
    { id: '3315420', name: 'BTS', lang: 'Korean', img: 'https://c.saavncdn.com/artists/BTS_005_20260406070015_500x500.jpg' },
    { id: '2518190', name: 'BLACKPINK', lang: 'Korean', img: 'https://c.saavncdn.com/artists/BlackPink_005_20260319191032_500x500.jpg' }
  ];

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      if (isLogin) await login({ email, password });
      else await register({ email, password, name });
      setStage('artists');
    } catch (err) {
      setError(err.message);
    }
    setIsLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      // Use Firebase's native password reset email — the OTP approach
      // cannot actually update Firebase passwords without Admin SDK.
      // Firebase's sendPasswordResetEmail is the correct, reliable approach.
      await resetPassword(email);
      setStage('reset-success');
    } catch (err) {
      // Show a friendly error message
      if (err.code === 'auth/user-not-found' || err.message?.includes('user-not-found')) {
        setError('No account found with this email address.');
      } else {
        setError(err.message || 'Failed to send reset email. Please try again.');
      }
    }
    setIsLoading(false);
  };


  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    // Auto-focus next
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const toggleArtist = (artist) => {
    if (preferredArtists.some(a => a.id === artist.id)) {
      setPreferredArtists(preferredArtists.filter(a => a.id !== artist.id));
    } else {
      setPreferredArtists([...preferredArtists, artist]);
    }
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-bg-video">
        <img src="https://images.unsplash.com/photo-1493225457124-a1a2a5f5f924?q=80&w=2070" className="bg-img" alt="" />
        <div className="overlay"></div>
      </div>

      <div className={`welcome-container stage-${stage}`}>
        {stage === 'intro' && (
          <div className="intro-content">
            <div className="glass-logo">
              <Music size={32} />
              <span>CHERIFY</span>
            </div>
            <h1 className="hero-text">Your Music. <br /><span>Perfected.</span></h1>
            <p className="hero-subtext">Deeply personalized streaming. High-fidelity audio. The global stage, simplified for you.</p>
            <div className="btn-group">
              <button className="btn-main glow-effect" onClick={() => setStage('auth')}>
                Start Listening <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {stage === 'auth' && (
          <div className="auth-card-perfect">
            <div className="auth-card-header">
              <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
              <p>{isLogin ? 'Access your personalized library' : 'Start your high-fidelity journey'}</p>
            </div>
            <form onSubmit={handleAuthSubmit} className="auth-form-perfect">
              {!isLogin && (
                <div className="input-field-perfect">
                  <User size={20} />
                  <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              )}
              <div className="input-field-perfect">
                <Mail size={20} />
                <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="input-field-perfect">
                <Lock size={20} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn-main full-width" disabled={isLoading}>
                {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')} <ShieldCheck size={20} />
              </button>
              {isLogin && (
                <button type="button" className="forgot-password-link" onClick={() => setStage('forgot')}>
                  Forgot password?
                </button>
              )}
            </form>
            {error && <div className="auth-error-simple">{error}</div>}
            <button className="btn-secondary full-width" style={{ marginTop: '12px', border: '1px solid rgba(255,255,255,0.1)', padding: '14px' }} onClick={() => setStage('artists')}>
              Continue as Guest
            </button>
            <p className="toggle-auth">
              {isLogin ? "New to Cherify?" : "Already a member?"} 
              <span onClick={() => setIsLogin(!isLogin)}> {isLogin ? 'Create one here' : 'Sign in here'}</span>
            </p>
          </div>
        )}

        {stage === 'forgot' && (
          <div className="auth-card-perfect">
             <button className="back-btn-simple" onClick={() => setStage('auth')}>
              <ArrowLeft size={20} />
            </button>
            <div className="auth-card-header">
              <h2>Reset Access</h2>
              <p>Enter your email to receive a secure reset link.</p>
            </div>
            <form onSubmit={handleResetPassword} className="auth-form-perfect">
              <div className="input-field-perfect">
                <Mail size={20} />
                <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <button type="submit" className="btn-main full-width" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Link'} <ShieldCheck size={20} />
              </button>
            </form>
            {error && <div className="auth-error-simple">{error}</div>}
          </div>
        )}


        {stage === 'reset-success' && (
          <div className="auth-card-perfect" style={{ textAlign: 'center' }}>
            <div style={{ width: '72px', height: '72px', background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <ShieldCheck size={36} color="#10b981" />
            </div>
            <div className="auth-card-header" style={{ marginBottom: '0' }}>
              <h2>Check Your Email</h2>
              <p>We've sent a password reset link to <strong style={{ color: 'white' }}>{email}</strong>. Click the link in that email to set your new password.</p>
            </div>
            <div style={{ background: 'rgba(249,115,22,0.08)', border: '1px dashed rgba(249,115,22,0.3)', borderRadius: '16px', padding: '16px', margin: '24px 0', textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}>
                <strong style={{ color: '#f97316', display: 'block', marginBottom: '4px' }}>⚠️ Can't find the email?</strong>
                Check your <strong>Spam / Junk folder</strong>. If it's there, open it and click <strong>"Report as not spam"</strong> to ensure future emails go to your inbox.
              </p>
            </div>
            <button className="btn-main full-width" onClick={() => { setStage('auth'); setIsLogin(true); setError(''); }}>
              Back to Sign In
            </button>
          </div>
        )}






        {stage === 'artists' && (
          <div className="artist-selection-perfect">
            <div className="artist-header">
              <h2>Choose Your <span>Inspiration</span></h2>
              <p>Pick at least 3 artists to personalize your Daily Mix.</p>
            </div>
            <div className="artist-scroll-grid">
              {globalArtists.map(artist => {
                const isSelected = preferredArtists.some(a => a.id === artist.id);
                return (
                  <div key={artist.id} className={`artist-pill ${isSelected ? 'selected' : ''}`} onClick={() => toggleArtist(artist)}>
                    <div className="pill-img">
                      <img src={artist.img} alt={artist.name} />
                      {isSelected && <div className="pill-check"><Check size={24} /></div>}
                    </div>
                    <span className="pill-name">{artist.name}</span>
                  </div>
                );
              })}
            </div>
            <button 
              className={`btn-main ${preferredArtists.length < 3 ? 'disabled' : ''}`}
              disabled={preferredArtists.length < 3}
              onClick={handleStart}
            >
              {preferredArtists.length < 3 ? `Choose ${3 - preferredArtists.length} More` : 'Finish & Listen'}
            </button>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .welcome-screen {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          z-index: 10000; overflow: hidden; display: flex; align-items: center; justify-content: center;
          font-family: 'Outfit', sans-serif;
        }
        .welcome-bg-video { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }
        .bg-img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.4); transform: scale(1.1); transition: transform 20s linear; }
        .welcome-screen:hover .bg-img { transform: scale(1.2); }
        .overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at center, transparent, rgba(0,0,0,0.8)); }

        .welcome-container { position: relative; z-index: 2; width: 100%; max-width: 1000px; padding: 40px; display: flex; justify-content: center; transition: all 0.5s ease; }
        
        .intro-content { text-align: center; max-width: 700px; animation: floatUp 1s ease-out; }
        .glass-logo { display: inline-flex; align-items: center; gap: 12px; padding: 12px 24px; background: rgba(255,255,255,0.1); backdrop-filter: blur(20px); border-radius: 500px; border: 1px solid rgba(255,255,255,0.2); margin-bottom: 40px; color: white; font-weight: 800; letter-spacing: 4px; }
        .hero-text { font-family: 'Syne', sans-serif; font-size: clamp(48px, 10vw, 96px); font-weight: 800; line-height: 1; margin-bottom: 24px; color: white; text-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .hero-text span { background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-subtext { font-size: 20px; color: rgba(255,255,255,0.7); margin-bottom: 48px; line-height: 1.6; max-width: 600px; margin-left: auto; margin-right: auto; }

        .btn-main { background: white; color: black; font-weight: 800; font-size: 18px; padding: 20px 48px; border-radius: 500px; display: flex; align-items: center; gap: 12px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; border: none; }
        .btn-main:hover { transform: translateY(-4px) scale(1.05); box-shadow: 0 20px 40px rgba(255,255,255,0.2); }
        .btn-main.full-width { width: 100%; justify-content: center; }
        .btn-main.disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; box-shadow: none !important; }

        .auth-card-perfect { background: rgba(0,0,0,0.6); backdrop-filter: blur(40px); border-radius: 40px; padding: 48px; width: 100%; max-width: 480px; border: 1px solid rgba(255,255,255,0.1); animation: slideIn 0.6s ease-out; }
        .auth-card-header h2 { font-family: 'Syne', sans-serif; font-size: 36px; font-weight: 800; color: white; margin-bottom: 8px; }
        .auth-card-header p { color: rgba(255,255,255,0.5); margin-bottom: 40px; }
        .auth-form-perfect { display: flex; flex-direction: column; gap: 16px; }
        .input-field-perfect { display: flex; align-items: center; gap: 16px; background: rgba(255,255,255,0.05); padding: 18px 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); transition: all 0.3s ease; }
        .input-field-perfect:focus-within { border-color: #6366f1; background: rgba(255,255,255,0.1); }
        .input-field-perfect input { background: none; border: none; color: white; font-size: 16px; width: 100%; outline: none; }
        .input-field-perfect svg { color: rgba(255,255,255,0.4); }
        .toggle-auth { text-align: center; margin-top: 24px; color: rgba(255,255,255,0.5); }
        .toggle-auth span { color: white; font-weight: 700; cursor: pointer; text-decoration: underline; margin-left: 8px; }

        .artist-selection-perfect { text-align: center; width: 100%; }
        .artist-header h2 { font-family: 'Syne', sans-serif; font-size: 48px; font-weight: 800; color: white; margin-bottom: 8px; }
        .artist-header h2 span { color: #6366f1; }
        .artist-header p { color: rgba(255,255,255,0.5); margin-bottom: 40px; }
        .artist-scroll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 24px; max-height: 480px; overflow-y: auto; padding: 12px; margin-bottom: 40px; }
        .artist-pill { cursor: pointer; transition: all 0.3s ease; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .pill-img { position: relative; width: 140px; height: 140px; border-radius: 50%; overflow: hidden; border: 4px solid transparent; transition: all 0.3s ease; }
        .artist-pill:hover .pill-img { transform: scale(1.05); border-color: rgba(255,255,255,0.2); }
        .artist-pill.selected .pill-img { border-color: #6366f1; transform: scale(1.1); }
        .pill-img img { width: 100%; height: 100%; object-fit: cover; }
        .pill-check { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(99, 102, 241, 0.4); display: flex; align-items: center; justify-content: center; color: white; }
        .pill-name { color: white; font-weight: 700; font-size: 16px; }

        .forgot-password-link {
          background: none; border: none; color: rgba(255,255,255,0.4);
          font-size: 14px; margin-top: 12px; cursor: pointer; transition: color 0.3s;
          text-align: right; width: 100%;
        }
        .forgot-password-link:hover { color: white; text-decoration: underline; }

        .auth-error-simple {
          margin-top: 16px; color: #ef4444; font-size: 13px; text-align: center;
          padding: 10px; background: rgba(239, 68, 68, 0.1); border-radius: 12px;
        }

        .success-icon-large {
          width: 80px; height: 80px; background: rgba(16, 185, 129, 0.1);
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px; color: #10b981; border: 2px solid rgba(16, 185, 129, 0.2);
        }
        .success-description { color: rgba(255,255,255,0.6); line-height: 1.6; margin-bottom: 32px; }
        .text-center { text-align: center; }

        .back-btn-simple {
          background: none; border: none; color: rgba(255,255,255,0.4);
          margin-bottom: 24px; cursor: pointer; transition: color 0.3s;
        }
        .back-btn-simple:hover { color: white; }

        .otp-container { display: flex; justify-content: space-between; gap: 8px; margin: 24px 0; }
        .otp-input {
          width: 50px; height: 60px; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;
          text-align: center; font-size: 24px; font-weight: 800; color: white;
          outline: none; transition: all 0.3s ease;
        }
        .otp-input:focus { border-color: #6366f1; background: rgba(255,255,255,0.1); transform: translateY(-4px); }
        .resend-link { background: none; border: none; color: rgba(255,255,255,0.4); margin-top: 20px; cursor: pointer; font-size: 14px; }
        .resend-link:hover { color: white; text-decoration: underline; }

        @keyframes floatUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
      `}} />
    </div>
  );
};

export default Welcome;
