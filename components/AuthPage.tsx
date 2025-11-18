import React, { useState, useEffect } from 'react';
import { ArrowRight, Cpu, Moon, Sun, Check, AlertCircle, Loader2 } from 'lucide-react';
import { User } from '../types';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  
  // Auth page specific theme toggle for demo purposes
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  // Parallax/Glow effect on mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const validate = () => {
    if (!formData.email || !formData.email.includes('@')) return "INVALID_EMAIL_FORMAT";
    if (formData.password.length < 6) return "PASSWORD_TOO_SHORT_MIN_6_CHARS";
    if (mode === 'SIGNUP' && !formData.name) return "IDENTITY_REQUIRED";
    if (mode === 'SIGNUP' && !termsAccepted) return "TERMS_NOT_ACCEPTED";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    
    // Simulate backend delay
    setTimeout(() => {
      const user: User = {
        id: 'user_' + Date.now(),
        name: formData.name || formData.email.split('@')[0],
        email: formData.email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.email}`
      };
      onLogin(user);
      setIsLoading(false);
    }, 1500);
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    // Simulate Google Auth flow
    setTimeout(() => {
      const user: User = {
        id: 'google_user_' + Date.now(),
        name: 'Alex Chen',
        email: 'alex.chen@gmail.com',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=AlexChen&backgroundColor=c0aede`
      };
      onLogin(user);
      setGoogleLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen w-full flex bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden relative selection:bg-indigo-500/30 transition-colors duration-500">
      {/* Toggle Theme Button Absolute */}
      <button 
        onClick={() => setIsDark(!isDark)}
        className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white/10 backdrop-blur-md border border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/20 transition-all"
      >
        {isDark ? <Sun size={20} className="text-white"/> : <Moon size={20} className="text-black"/>}
      </button>

      {/* Ambient Background Mesh - Follows Mouse */}
      <div 
        className="absolute inset-0 transition-all duration-1000 ease-out opacity-30 pointer-events-none mix-blend-multiply dark:mix-blend-screen"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(29, 78, 216, 0.15), transparent 40%)`
        }}
      />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>

      {/* Left Side - The "System" (Desktop Only) */}
      <div className="hidden lg:flex w-[55%] relative flex-col justify-between p-16 border-r border-zinc-200 dark:border-white/5 bg-white dark:bg-transparent transition-colors duration-500">
        {/* Header System Status */}
        <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-600 font-mono text-xs tracking-widest uppercase">
          <Cpu size={14} />
          <span>System_Ready // v.2.5.0-rc</span>
        </div>

        {/* Main Branding Text */}
        <div className="relative z-10 pl-4">
          <div className="absolute -left-0 top-2 bottom-2 w-[2px] bg-gradient-to-b from-blue-600 via-indigo-600 to-transparent"></div>
          <h1 className="text-7xl font-bold tracking-tighter leading-[0.9] mb-6 text-zinc-900 dark:text-white">
            CREDIT<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">LOGIC</span><br />
            SYSTEMS
          </h1>
          <p className="text-zinc-500 max-w-md text-lg font-light leading-relaxed">
            Advanced financial telemetry for the modern entity. 
            Input data. Analyze patterns. Optimize wealth.
          </p>
        </div>

        {/* Footer Stats */}
        <div className="flex gap-12">
           <div className="space-y-1">
             <div className="text-[10px] text-zinc-500 dark:text-zinc-600 uppercase tracking-widest font-bold">Encryption</div>
             <div className="font-mono text-sm text-green-600 dark:text-green-500/80">AES-256-GCM</div>
           </div>
           <div className="space-y-1">
             <div className="text-[10px] text-zinc-500 dark:text-zinc-600 uppercase tracking-widest font-bold">Status</div>
             <div className="font-mono text-sm text-blue-600 dark:text-blue-500 animate-pulse">ONLINE</div>
           </div>
           <div className="space-y-1">
             <div className="text-[10px] text-zinc-500 dark:text-zinc-600 uppercase tracking-widest font-bold">Active Nodes</div>
             <div className="font-mono text-sm text-zinc-400">8,492</div>
           </div>
        </div>
      </div>

      {/* Right Side - Auth Terminal */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-8 lg:px-24 relative z-20 bg-zinc-50 dark:bg-black/20 backdrop-blur-sm transition-colors duration-500">
        <div className="max-w-sm w-full mx-auto">
          
          {/* Dynamic Greeting */}
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-200/50 dark:bg-white/5 border border-zinc-300/50 dark:border-white/5 text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-6 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              BudgetBuddy AI
            </div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">
              {mode === 'LOGIN' ? 'Identify Yourself' : 'Initialize Entity'}
            </h2>
            <p className="text-zinc-500 dark:text-zinc-500 text-sm">
              {mode === 'LOGIN' ? 'Enter access credentials to proceed.' : 'Begin the onboarding protocol.'}
            </p>
          </div>

          {/* Google Auth Button */}
          <div className="mb-8">
            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading || googleLoading}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 h-12 text-xs font-bold flex items-center justify-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white transition-all uppercase tracking-wider shadow-sm dark:shadow-none group relative overflow-hidden rounded-sm"
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>{mode === 'LOGIN' ? 'Sign in with Google' : 'Sign up with Google'}</span>
                </>
              )}
            </button>
            
            <div className="relative flex py-5 items-center">
              <div className="flex-grow border-t border-zinc-300 dark:border-zinc-800"></div>
              <span className="flex-shrink-0 mx-4 text-zinc-400 dark:text-zinc-600 text-[10px] uppercase tracking-widest">Or Manual Entry</span>
              <div className="flex-grow border-t border-zinc-300 dark:border-zinc-800"></div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
            
            {/* Name Field - Collapsible */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${mode === 'SIGNUP' ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="group relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="peer w-full bg-transparent border-b border-zinc-300 dark:border-white/10 py-3 text-zinc-900 dark:text-white focus:border-zinc-900 dark:focus:border-white focus:outline-none transition-colors placeholder-transparent"
                  placeholder="Name"
                  id="name"
                  autoComplete="off"
                />
                <label htmlFor="name" className="absolute left-0 -top-3.5 text-zinc-500 dark:text-zinc-600 text-xs font-mono uppercase tracking-wider transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-zinc-500 peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-zinc-900 dark:peer-focus:text-white cursor-text">
                  FULL_NAME
                </label>
                <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-zinc-900 dark:bg-white transition-all duration-300 peer-focus:w-full"></div>
              </div>
            </div>

            <div className="group relative">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="peer w-full bg-transparent border-b border-zinc-300 dark:border-white/10 py-3 text-zinc-900 dark:text-white focus:border-zinc-900 dark:focus:border-white focus:outline-none transition-colors placeholder-transparent"
                placeholder="Email"
                id="email"
                autoComplete="off"
              />
              <label htmlFor="email" className="absolute left-0 -top-3.5 text-zinc-500 dark:text-zinc-600 text-xs font-mono uppercase tracking-wider transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-zinc-500 peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-zinc-900 dark:peer-focus:text-white cursor-text">
                EMAIL_ADDRESS
              </label>
              <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-zinc-900 dark:bg-white transition-all duration-300 peer-focus:w-full"></div>
            </div>

            <div className="group relative">
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="peer w-full bg-transparent border-b border-zinc-300 dark:border-white/10 py-3 text-zinc-900 dark:text-white focus:border-zinc-900 dark:focus:border-white focus:outline-none transition-colors placeholder-transparent"
                placeholder="Password"
                id="password"
              />
              <label htmlFor="password" className="absolute left-0 -top-3.5 text-zinc-500 dark:text-zinc-600 text-xs font-mono uppercase tracking-wider transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-zinc-500 peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-zinc-900 dark:peer-focus:text-white cursor-text">
                ACCESS_KEY
              </label>
              <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-zinc-900 dark:bg-white transition-all duration-300 peer-focus:w-full"></div>
            </div>

            {/* Extra Auth Options */}
            {mode === 'SIGNUP' ? (
              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setTermsAccepted(!termsAccepted)}
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${termsAccepted ? 'bg-blue-600 border-blue-600 text-white' : 'border-zinc-400 dark:border-zinc-600 hover:border-zinc-900 dark:hover:border-zinc-400'}`}
                >
                  {termsAccepted && <Check size={12} strokeWidth={3} />}
                </button>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  I accept the <a href="#" className="underline hover:text-zinc-900 dark:hover:text-white">Terms of Protocol</a>
                </span>
              </div>
            ) : (
              <div className="flex justify-end pt-2">
                 <a href="#" className="text-[10px] uppercase tracking-wider text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                   Forgot Access Key?
                 </a>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-500 text-xs font-mono bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-900/50 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={14} />
                <span>ERROR: {error}</span>
              </div>
            )}

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isLoading || googleLoading}
                className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black font-bold h-14 text-xs uppercase tracking-[0.2em] hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group relative overflow-hidden shadow-lg hover:shadow-xl rounded-sm"
              >
                <div className="absolute inset-0 bg-zinc-800 dark:bg-zinc-200 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative flex items-center gap-3">
                   {isLoading ? <Loader2 className="animate-spin" size={16} /> : (mode === 'LOGIN' ? 'AUTHENTICATE' : 'REGISTER ENTITY')}
                   {!isLoading && <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>}
                </span>
              </button>
            </div>
          </form>

          <div className="mt-12 flex justify-between items-end border-t border-zinc-200 dark:border-white/10 pt-6 animate-in fade-in duration-1000 delay-300">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase text-zinc-500 dark:text-zinc-600 font-bold">Security Level</span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">MAXIMUM</span>
            </div>
            <button 
              onClick={() => {
                setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN');
                setError(null);
                setFormData({ name: '', email: '', password: '' });
              }}
              className="text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-xs font-mono uppercase tracking-widest transition-colors text-right pb-1"
            >
              {mode === 'LOGIN' ? '[ Create_New_ID ]' : '[ User_Login ]'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};