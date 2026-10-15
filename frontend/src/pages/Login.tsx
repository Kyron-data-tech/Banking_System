import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';
import { SignIn, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { KyroLogo } from '../components/KyroLogo';
import { 

  ShieldCheck,
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  UserCheck,
  User,
  Store,
  Landmark,
  Sparkles
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  { email: 'maker@corp.com', label: 'Corporate Maker', role: 'CORP_MAKER', badgeColor: 'border-blue-200 text-blue-700 bg-blue-50' },
  { email: 'checker@corp.com', label: 'Corporate Checker', role: 'CORP_CHECKER', badgeColor: 'border-indigo-200 text-indigo-700 bg-indigo-50' },
  { email: 'viewer@corp.com', label: 'Corporate Viewer', role: 'CORP_VIEWER', badgeColor: 'border-slate-200 text-slate-700 bg-slate-50' },
  { email: 'admin@corp.com', label: 'Corporate Admin', role: 'CORP_ADMIN', badgeColor: 'border-purple-200 text-purple-700 bg-purple-50' },
  { email: 'ops@bank.com', label: 'Payment Operations', role: 'PAYMENT_OPERATIONS', badgeColor: 'border-emerald-200 text-emerald-700 bg-emerald-50' },
  { email: 'audit@bank.com', label: 'Bank Auditor', role: 'BANK_AUDITOR', badgeColor: 'border-rose-200 text-rose-700 bg-rose-50' },
  { email: 'compliance@bank.com', label: 'Compliance Officer', role: 'COMPLIANCE_OFFICER', badgeColor: 'border-amber-200 text-amber-700 bg-amber-50' },
  { email: 'superadmin@bank.com', label: 'Bank Super Admin', role: 'BANK_SUPER_ADMIN', badgeColor: 'border-red-200 text-red-700 bg-red-50' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [useOtp, setUseOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [persona, setPersona] = useState<'USER' | 'MERCHANT' | 'EMPLOYEE'>('USER');
  
  const { login, isAuthenticated } = useAuth();
  const { isSignedIn } = useClerkAuth();
  const navigate = useNavigate();

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setUseOtp(false);
  };

    const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isRegister) {
        await authApi.register({
          email,
          password: useOtp ? otp : password,
          fullName,
          
        });
      }
      await login(email, useOtp ? otp : password);
      navigate('/dashboard');
    } catch (err: any) {
      if (isRegister && err.message?.toLowerCase().includes('already registered')) {
            setIsRegister(false);
            setError('You already have an account. Please sign in with your password.');
        } else {
            setError(err.message || (isRegister ? 'Registration failed' : 'Invalid email or password'));
        }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative z-10 animate-fade-in">
      

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Network Telemetry Status Badges */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-bold text-slate-500 mb-4 font-mono">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>KyroPay Switch: Online</span>
          <span>•</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500"></span>NPCI UPI Rails: Active</span>
          <span>•</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500"></span>256-Bit SSL</span>
        </div>

        <div className="flex justify-center">
          <div className="flex flex-col items-center">
            <KyroLogo size="xl" variant={persona === 'USER' ? 'personal' : persona === 'MERCHANT' ? 'merchant' : 'bank'} animated />
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/90 border border-blue-200/70 text-blue-700 text-xs font-bold tracking-wider uppercase backdrop-blur-sm shadow-sm">
              <Sparkles size={13} className="text-blue-500 animate-pulse" />
              {persona === 'USER' ? 'Consumer UPI 2.0' : persona === 'MERCHANT' ? 'Merchant Operations' : 'Bank Treasury CBS'}
            </div>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          {persona === 'USER' ? (
            <>Kyro<span className="text-blue-600">Pay</span></>
          ) : persona === 'MERCHANT' ? (
            <>KyroPay <span className="text-indigo-600">Business</span></>
          ) : (
            <>KyroBank <span className="text-slate-900">Core CBS</span></>
          )}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          {persona === 'USER' 
            ? 'Next-Gen UPI 2.0 & Instant Payments Gateway' 
            : persona === 'MERCHANT' 
            ? 'Merchant POS Terminal, Live Soundbox & Settlements' 
            : 'Enterprise Core Banking, Clearing Switch & Treasury'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/80 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-white/20">
          
          <div className="mb-6 text-center">
            <h3 className="text-lg font-bold text-slate-900">
              {persona === 'USER' ? 'Sign in to KyroPay Personal' : persona === 'MERCHANT' ? 'Sign in to Merchant Hub' : 'Bank Staff & Governance Portal'}
            </h3>
            <p className="text-slate-500 mt-1.5 text-xs">
              {persona === 'USER' ? 'Access your UPI 2.0 wallet, instant transfers & QR scanner' : persona === 'MERCHANT' ? 'Manage business collections, dynamic QR standees & settlements' : 'Authorized internal bank personnel login with 4-eyes Maker-Checker'}
            </p>
          </div>

          {/* Quick 1-Click Instant Demo Portals for Evaluators */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white shadow-xl border border-blue-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-blue-500/20 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-300 flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber-400 animate-spin" /> Quick 1-Click Demo Profiles
              </span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                Direct Access
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 relative z-10">
              {/* 1. Consumer */}
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('userType', 'user');
                  localStorage.setItem('demoUser', 'true');
                  navigate('/dashboard');
                }}
                className="flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition transform hover:scale-105 active:scale-95 cursor-pointer text-center group"
                title="Sign in as Consumer UPI User"
              >
                <span className="text-[11px] font-black text-white group-hover:text-cyan-300">👤 Consumer</span>
                <span className="text-[9px] text-blue-200 mt-0.5 font-mono">Vansh Jain</span>
              </button>

              {/* 2. Merchant */}
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('userType', 'merchant');
                  localStorage.setItem('demoUser', 'true');
                  navigate('/dashboard');
                }}
                className="flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition transform hover:scale-105 active:scale-95 cursor-pointer text-center group"
                title="Sign in as Business Merchant"
              >
                <span className="text-[11px] font-black text-white group-hover:text-indigo-300">🏪 Merchant</span>
                <span className="text-[9px] text-blue-200 mt-0.5 font-mono">Store Hub</span>
              </button>

              {/* 3. Bank Super Admin */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    setLoading(true);
                    await login('superadmin@bank.com', 'password123');
                    localStorage.setItem('userType', 'bank_employee');
                    navigate('/dashboard');
                  } catch (err) {
                    setPersona('EMPLOYEE');
                    handleDemoFill('superadmin@bank.com');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition transform hover:scale-105 active:scale-95 cursor-pointer text-center group"
                title="Sign in as Bank Super Admin"
              >
                <span className="text-[11px] font-black text-white group-hover:text-amber-300">🏦 Bank Staff</span>
                <span className="text-[9px] text-blue-200 mt-0.5 font-mono">Core Treasury</span>
              </button>
            </div>
          </div>

          {/* Persona Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
            <button 
              type="button"
              onClick={() => { setPersona('USER'); localStorage.setItem('userType', 'user'); if (isSignedIn) navigate('/dashboard'); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 transform active:scale-95 ${persona === 'USER' ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5 scale-105' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              <span className="flex items-center justify-center gap-1.5"><User size={15} /> Normal User</span>
            </button>
            <button 
              type="button"
              onClick={() => { setPersona('MERCHANT'); localStorage.setItem('userType', 'merchant'); if (isSignedIn) navigate('/dashboard'); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 transform active:scale-95 ${persona === 'MERCHANT' ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5 scale-105' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              <span className="flex items-center justify-center gap-1.5"><Store size={15} /> Merchant</span>
            </button>
            <button 
              type="button"
              onClick={() => { setPersona('EMPLOYEE'); if (isAuthenticated) navigate('/dashboard'); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 transform active:scale-95 ${persona === 'EMPLOYEE' ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5 scale-105' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              <span className="flex items-center justify-center gap-1.5"><Landmark size={15} /> Bank Staff</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {persona !== 'EMPLOYEE' ? (
            <div className="flex justify-center py-4 w-full">
              {isSignedIn ? (
                  <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <ShieldCheck className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">You are securely signed in</h3>
                    <p className="text-sm text-slate-500 mb-6 text-center max-w-xs">You can continue to your selected portal or sign out to use a different account.</p>
                    <button onClick={() => navigate('/dashboard')} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition-colors">
                      Continue to Dashboard
                    </button>
                  </div>
                ) : (
                  <SignIn routing="hash" forceRedirectUrl="/dashboard" />
                )}
            </div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-5">
              {isRegister && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <UserCheck size={18} className="text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow sm:text-sm"
                      placeholder="Enter your full name"
                      required={isRegister}
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  {persona === 'EMPLOYEE' ? 'Staff Email' : 'Merchant Email'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow sm:text-sm"
                    placeholder={persona === 'EMPLOYEE' ? 'employee@kyrobank.com' : 'admin@corporate.com'}
                    required
                  />
                </div>
              </div>

              {useOtp && persona !== 'EMPLOYEE' ? (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-slate-700">Enter OTP</label>
                    <button type="button" onClick={() => setUseOtp(false)} className="text-xs text-blue-600 font-semibold hover:underline">
                      Use Password
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock size={18} className="text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="block w-full pl-11 pr-20 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow sm:text-sm"
                      placeholder="6-digit OTP"
                      required
                    />
                    <button type="button" className="absolute inset-y-0 right-2 pr-2 flex items-center text-xs font-bold text-blue-600 hover:text-blue-700">
                      Resend
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-slate-700">Password</label>
                    {persona !== 'EMPLOYEE' && (
                      <button type="button" onClick={() => setUseOtp(true)} className="text-xs text-blue-600 font-semibold hover:underline">
                        Login with OTP
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock size={18} className="text-slate-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-11 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow sm:text-sm"
                      placeholder="••••••••"
                      required={!useOtp}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>{isRegister ? "Sign Up" : "Sign In"} <ArrowRight size={18} /></>
                )}
              </button>
              
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-sm text-blue-600 hover:underline font-semibold"
                >
                  {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>
            </form>
          )}

          {persona === 'EMPLOYEE' && (
            <div className="mt-4">
              <div className="relative flex items-center my-4">
                <div className="flex-1 border-t border-slate-200" />
                <span className="mx-3 text-xs text-slate-400 font-medium">OR</span>
                <div className="flex-1 border-t border-slate-200" />
              </div>
              <a
                href={`${window.location.protocol}//${window.location.hostname}:8080/oauth2/authorization/google`}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition text-sm font-medium text-slate-700"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </a>
            </div>
          )}

          {persona === 'EMPLOYEE' && (
            <div className="pt-8 border-t border-slate-200 mt-8">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <UserCheck size={14} />
                Quick Demo Accounts
              </h3>
              <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                {DEMO_ACCOUNTS.map((account, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleDemoFill(account.email)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:shadow-sm ${account.badgeColor}`}
                  >
                    {account.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
