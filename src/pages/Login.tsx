import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../api/auth';
import { HeartPulse, Eye, EyeOff, UserCheck, ShieldCheck, KeyRound, ArrowLeft, MailCheck, ShieldAlert } from 'lucide-react';
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom';

export default function Login() {
  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset_confirm'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [devResetInfo, setDevResetInfo] = useState<{ token: string; url: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('reset_token');
    if (tokenFromUrl) {
      setResetToken(tokenFromUrl);
      setMode('reset_confirm');
    }
  }, [searchParams]);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleQuickLogin = async (prefillEmail: string, prefillPass: string) => {
    setError('');
    setSuccessMsg('');
    setEmail(prefillEmail);
    setPassword(prefillPass);
    setMode('login');
    setLoading(true);
    try {
      await login({ email: prefillEmail.trim().toLowerCase(), password: prefillPass });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    try {
      if (mode === 'login') {
        await login({ email: cleanEmail, password: cleanPassword });
        navigate('/');
      } else if (mode === 'register') {
        if (cleanPassword.length < 8) {
          throw new Error('Password must be at least 8 characters long for security.');
        }
        await register({ email: cleanEmail, password: cleanPassword, name: name.trim() });
        navigate('/');
      } else if (mode === 'forgot') {
        const res = await authService.requestReset(cleanEmail);
        setSuccessMsg(res.message);
        if (res.devResetToken) {
          setDevResetInfo({ token: res.devResetToken, url: res.devResetUrl || '' });
        }
      } else if (mode === 'reset_confirm') {
        const cleanToken = resetToken.trim();
        if (!cleanToken) {
          throw new Error('Please enter the reset token provided in your reset email or link.');
        }
        if (cleanPassword.length < 8) {
          throw new Error('New password must be at least 8 characters long.');
        }
        if (cleanPassword !== confirmPassword) {
          throw new Error('Passwords do not match. Please verify and try again.');
        }

        const res = await authService.resetPasswordWithToken(cleanToken, cleanPassword);
        setSuccessMsg(res.message || 'Password has been reset successfully! You can now sign in.');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        setResetToken('');
        setDevResetInfo(null);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const proceedWithDevToken = (token: string) => {
    setResetToken(token);
    setMode('reset_confirm');
    setError('');
    setSuccessMsg('Token applied. Please specify your new password below.');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/20">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-slate-900">
          {mode === 'login' && 'Sign in to MediTrack'}
          {mode === 'register' && 'Create your MediTrack Account'}
          {mode === 'forgot' && 'Reset Account Password'}
          {mode === 'reset_confirm' && 'Set New Password'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          {mode === 'login' && (
            <>
              Or{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
                className="font-medium text-emerald-600 hover:text-emerald-500"
              >
                register a new account
              </button>
            </>
          )}
          {mode === 'register' && (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                className="font-medium text-emerald-600 hover:text-emerald-500"
              >
                sign in instead
              </button>
            </>
          )}
          {(mode === 'forgot' || mode === 'reset_confirm') && (
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); setDevResetInfo(null); }}
              className="inline-flex items-center gap-1 font-medium text-emerald-600 hover:text-emerald-500"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to sign in</span>
            </button>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-xl sm:px-10">
          {/* Quick Demo Credentials Access - only on login mode */}
          {mode === 'login' && (
            <div className="mb-6 pb-6 border-b border-slate-100">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 text-center">
                Quick One-Click Demo Access
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin('test@meditrack.com', 'password123')}
                  className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg border border-emerald-200 bg-emerald-50/60 text-emerald-800 hover:bg-emerald-100/70 transition-colors disabled:opacity-50"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Patient Demo</span>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin('admin@meditrack.com', 'admin123')}
                  className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg border border-indigo-200 bg-indigo-50/60 text-indigo-800 hover:bg-indigo-100/70 transition-colors disabled:opacity-50"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Admin Demo</span>
                </button>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-700">Full Name</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Johnson"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full appearance-none rounded-lg border border-slate-300 px-3 py-2 placeholder-slate-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
              <div>
                <label className="block text-sm font-medium text-slate-700">Email address</label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full appearance-none rounded-lg border border-slate-300 px-3 py-2 placeholder-slate-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                  />
                </div>
              </div>
            )}

            {mode === 'reset_confirm' && (
              <div>
                <label className="block text-sm font-medium text-slate-700">Password Reset Token</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    placeholder="Enter the 64-character reset token"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="block w-full font-mono text-xs appearance-none rounded-lg border border-slate-300 px-3 py-2 placeholder-slate-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Cryptographic single-use token sent to your verified email.
                </p>
              </div>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'reset_confirm') && (
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">
                    {mode === 'reset_confirm' ? 'New Password' : 'Password'}
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setError(''); setSuccessMsg(''); }}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-500"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="mt-1 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={mode === 'reset_confirm' || mode === 'register' ? 'Minimum 8 characters' : '••••••••'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full appearance-none rounded-lg border border-slate-300 px-3 py-2 pr-10 placeholder-slate-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'reset_confirm' && (
              <div>
                <label className="block text-sm font-medium text-slate-700">Confirm New Password</label>
                <div className="mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full appearance-none rounded-lg border border-slate-300 px-3 py-2 placeholder-slate-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                  />
                </div>
              </div>
            )}

            {/* Development Mode Quick Reset Helper */}
            {devResetInfo && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-2">
                <div className="flex items-center gap-1.5 font-semibold">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Development Mode Reset Token</span>
                </div>
                <p className="text-[11px] text-amber-700">
                  Because local environment does not transmit external emails, your secure token was generated locally:
                </p>
                <div className="p-1.5 bg-white border border-amber-200 rounded font-mono text-[10px] break-all select-all">
                  {devResetInfo.token}
                </div>
                <button
                  type="button"
                  onClick={() => proceedWithDevToken(devResetInfo.token)}
                  className="w-full py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded text-xs transition-colors flex items-center justify-center gap-1"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Proceed to Set New Password</span>
                </button>
              </div>
            )}

            {successMsg && (
              <div className="flex items-start gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <MailCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center items-center gap-2 rounded-lg border border-transparent bg-emerald-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                {loading
                  ? 'Please wait...'
                  : mode === 'login'
                  ? 'Sign in'
                  : mode === 'register'
                  ? 'Create account'
                  : mode === 'forgot'
                  ? 'Send password reset link'
                  : 'Update password'}
              </button>
            </div>

            {mode === 'forgot' && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setMode('reset_confirm'); setError(''); setSuccessMsg(''); }}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Already have a reset token? Enter it here
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
