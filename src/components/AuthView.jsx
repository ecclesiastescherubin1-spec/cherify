import { useState, useContext } from 'react';
import { PlayerContext } from '../context/PlayerContext';
import { Mail, Lock, User, Music, ShieldCheck } from 'lucide-react';

const AuthView = () => {
  const { login, register, resetPassword } = useContext(PlayerContext);
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'signup') {
        await register(email, password, name);
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setMode('login');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="auth-view-perfect-container">
      <div className="auth-floating-card">
        <div className="auth-card-inner">
          <div className="auth-logo-section">
            <div className="logo-circle">
              <Music size={32} color="white" />
            </div>
            <h1 className="logo-text">CHERIFY</h1>
          </div>

          <div className="auth-text-content">
            <h2>{mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Join the Elite' : 'Recover Access'}</h2>
            <p>
              {mode === 'login' ? 'Sign in to continue your high-fidelity journey.' : 
               mode === 'signup' ? 'Experience the next generation of personalized streaming.' :
               'We will send a secure reset link to your registered email.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form-v2">
            {mode === 'signup' && (
              <div className="auth-input-v2">
                <User size={20} />
                <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div className="auth-input-v2">
              <Mail size={20} />
              <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {mode !== 'forgot' && (
              <div className="auth-input-v2">
                <Lock size={20} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            )}
            
            {mode === 'login' && (
              <button type="button" className="forgot-link" onClick={() => setMode('forgot')}>
                Forgot password?
              </button>
            )}
            
            <button type="submit" className="auth-submit-v2">
              {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'} <ShieldCheck size={20} />
            </button>
          </form>

          <div className="auth-footer-v2">
            <p>{mode === 'login' ? "New to the platform?" : "Back to security?"}</p>
            <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              {mode === 'login' ? 'Sign up for free' : 'Sign in here'}
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .auth-view-perfect-container {
          display: flex; align-items: center; justify-content: center; min-height: 80vh;
          padding: 24px; perspective: 1000px;
        }
        .auth-floating-card {
          width: 100%; max-width: 500px; background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(40px); border-radius: 48px; border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 40px 100px rgba(0,0,0,0.6); animation: cardFloat 0.8s ease-out;
        }
        .auth-card-inner { padding: 56px; }
        
        .auth-logo-section { display: flex; flex-direction: column; align-items: center; gap: 16px; margin-bottom: 48px; }
        .logo-circle { width: 64px; height: 64px; background: linear-gradient(135deg, #6366f1, #ec4899); border-radius: 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 20px rgba(99, 102, 241, 0.4); }
        .logo-text { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: white; letter-spacing: 4px; }

        .auth-text-content { text-align: center; margin-bottom: 40px; }
        .auth-text-content h2 { font-family: 'Syne', sans-serif; font-size: 36px; font-weight: 800; color: white; margin-bottom: 8px; }
        .auth-text-content p { color: rgba(255, 255, 255, 0.5); font-size: 15px; line-height: 1.5; }

        .auth-form-v2 { display: flex; flex-direction: column; gap: 20px; }
        .auth-input-v2 {
          display: flex; align-items: center; gap: 16px; background: rgba(255, 255, 255, 0.05);
          padding: 20px 28px; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .auth-input-v2:focus-within { background: rgba(255, 255, 255, 0.1); border-color: #6366f1; transform: translateX(8px); }
        .auth-input-v2 input { background: none; border: none; color: white; width: 100%; outline: none; font-size: 16px; font-weight: 500; }
        .auth-input-v2 svg { color: rgba(255, 255, 255, 0.3); transition: color 0.3s; }
        .auth-input-v2:focus-within svg { color: #6366f1; }

        .auth-submit-v2 {
          margin-top: 12px; background: white; color: black; font-weight: 800; font-size: 18px;
          padding: 20px; border-radius: 24px; display: flex; align-items: center; justify-content: center;
          gap: 12px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        .auth-submit-v2:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 20px 40px rgba(255,255,255,0.2); }

        .auth-footer-v2 { margin-top: 40px; text-align: center; }
        .auth-footer-v2 p { color: rgba(255, 255, 255, 0.4); font-size: 14px; margin-bottom: 8px; }
        .auth-footer-v2 button { color: white; font-weight: 700; text-decoration: underline; background: none; border: none; cursor: pointer; font-size: 15px; }
        
        .forgot-link {
          background: none; border: none; color: rgba(255, 255, 255, 0.4);
          font-size: 14px; text-align: right; cursor: pointer; margin: -10px 0 10px 0;
          transition: color 0.3s; width: fit-content; align-self: flex-end;
        }
        .forgot-link:hover { color: white; text-decoration: underline; }

        @keyframes cardFloat { from { opacity: 0; transform: translateY(60px) rotateX(-10deg); } to { opacity: 1; transform: translateY(0) rotateX(0); } }
      `}} />
    </div>
  );
};

export default AuthView;
